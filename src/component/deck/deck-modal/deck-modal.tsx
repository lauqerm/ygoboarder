import Moveable from 'react-moveable';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { DraggableCard } from '../../card';
import {
    DROP_TYPE_DECK,
    DECK_COL_COUNT,
    DragTransformStatRegex,
    DeckType,
    BeaconAction,
    BeaconActionLabel,
    PROP_DOM_ENTITY_NAME,
    DOMEntityTypeClass,
    DOM_ENTITY_CLASS,
    DOMEntityType,
    PROP_DOM_ENTITY_TYPE,
    PropDOMEntityVisible,
    DECK_ROW_COUNT,
    MODAL_WRAPPER_ID,
    PhaseType,
    CardPreset,
} from 'src/model';
import { DeckBeacon, DeckBeaconWrapper } from '../deck-beacon';
import {
    DeckCard,
    DeckListConverter,
    ZIndexInstanceConverter,
    useCountStore,
    useDeckStore,
    useZIndexState,
    useDOMEntityStateStore,
    PhaseBehavior,
} from 'src/state';
import { DeckImporter, DeckImporterRef } from '../deck-import';
import { DeckModalHandleContainer, DECK_MODAL_HEIGHT, DECK_MODAL_WIDTH, ModalContainer, ModalRowContainer } from './deck-modal-styled';
import { Droppable, Draggable, DraggableStateSnapshot, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';
import { ExtractProps } from 'src/type';
import { List } from 'immutable';
import { createPortal } from 'react-dom';
import { mergeClass } from 'src/util';
import './deck-modal.scss';
import { PlayerTag } from 'src/component/atom';

const distributeDeckRow = (cardList: List<DeckCard>) => {
    const processedDeckRow: { card: DeckCard, index: number }[][] = [];
    let currentRowList: { card: DeckCard, index: number }[] = [];
    let currentCounter = 0;

    cardList.forEach(entry => {
        currentRowList.push({ card: entry, index: currentCounter });

        if ((1 + currentCounter) % DECK_COL_COUNT === 0) {
            processedDeckRow.push(currentRowList);
            currentRowList = [];
        }
        currentCounter += 1;
    });
    if (currentRowList.length !== 0) processedDeckRow.push(currentRowList);

    return processedDeckRow;
};

const getDraggingClass = (style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot, index: number): string => {
    /** Indicator để giúp user nhận biết vị trí sẽ drag */
    if (!snapshot.isDragging && (style?.transform ?? '').length > 0) {
        return 'affected-by-dragging';
    }
    if (snapshot.isDragging) return 'is-dragging';
    return '';
};
const getDraggingStyle = (style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot): React.CSSProperties | undefined => {
    /** Giảm giật layout */
    if (!snapshot.isDragging) {
        /** Không dùng regex vì quá lười */
        return {
            ...style,
            transform: '',
        };
    }
    /** Skip hết mức transition lúc drop để giảm giật layout */
    if (snapshot.isDropAnimating && snapshot.dropAnimation) {
        const { curve } = snapshot.dropAnimation;

        return {
            ...style,
            visibility: snapshot.isDropAnimating ? 'hidden' : 'visible',
            transition: `all ${curve} 0.001s, visibility 0s`,
        };
    }
    return style;
};

export type DeckModalRef = {
    shuffle: () => void,
};
export type DeckModal = {
    className?: string,
    deckId: string,
    displayName: string,
    isVisible?: boolean,
    type: DeckType,
    defaultPhase: PhaseType,
    phaseBehavior: PhaseBehavior,
    preset: CardPreset,
    onClose?: () => void,
    beaconList?: BeaconAction[],
};
export const DeckModal = React.forwardRef(({
    className,
    deckId,
    displayName,
    isVisible = false,
    type,
    defaultPhase,
    phaseBehavior,
    preset,
    onClose,
    beaconList = [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
}: DeckModal, ref: React.ForwardedRef<DeckModalRef>) => {
    const [isFocused, setFocused] = useState(false);
    const [isAddingCard, setAddingCard] = useState(false);
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    const [handle, setHandle] = useState<HTMLDivElement | null>(null);
    const deckData = useDeckStore(
        state => state.deckMap.get(deckId, DeckListConverter()),
        (oldState, newState) => oldState.equals(newState),
    );
    const currentFullDeckList = deckData.get('cardList');
    const deckCount = useCountStore(state => state.countMap[deckId]);
    const recalculateDOMEntity = useDOMEntityStateStore(state => state.recalculate);

    const {
        register,
        deleteFromList,
        duplicateInList,
        shuffleList,
        flipInList,
    } = useDeckStore(
        state => ({
            register: state.register,
            addToList: state.add,
            deleteFromList: state.delete,
            duplicateInList: state.duplicate,
            shuffleList: state.shuffle,
            flipInList: state.flip,
        }),
        () => true,
    );
    const {
        modalInstance,
        focus,
    } = useZIndexState(
        state => ({
            modalInstance: state.categoryMap['modal'].queueMap.get(deckId, ZIndexInstanceConverter()),
            focus: state.toTop,
        }),
        (prev, next) => {
            return prev.modalInstance.get('name') === next.modalInstance.get('name')
                && prev.modalInstance.get('zIndex') === next.modalInstance.get('zIndex');
        },
    );
    const currentZIndex = modalInstance.get('zIndex');

    useImperativeHandle(ref, () => ({
        shuffle: () => {
            shuffleList(deckId);
        },
    }));

    const onDrag = useCallback(({
        target: handleTarget,
        left, top,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDrag']>>[0]) => {
        handleTarget!.style.left = `${left}px`;
        handleTarget!.style.top = `${top}px`;

        target!.style.left = `${left}px`;
        target!.style.top = `${top}px`;
    }, [target]);

    useEffect(() => {
        if (target && handle) {
            const initialLeft = Math.max(0, window.innerWidth - DECK_MODAL_WIDTH) / 2;
            const initialTop = Math.max(0, window.innerHeight - DECK_MODAL_HEIGHT) / 2;

            handle.style.left = `${initialLeft}px`;
            handle.style.top = `${initialTop}px`;

            target.style.left = `${initialLeft}px`;
            target.style.top = `${initialTop}px`;
        }
    }, [target, handle]);

    const currentDeckList = distributeDeckRow(currentFullDeckList);
    /**
     * Vì ta chia không gian modal ra từng row để drag, nên sẽ có thời điểm row không phủ kín hết modal.
     * 
     * Ví dụ với modal cho 3 row:
     * |00000000
     * |0000
     * |<-- Trống -->
     * 
     * Để khắc phục, row cuối cùng phải cao lên để phủ kín phần không gian còn lại, đây là hệ số cho biết row cuối phải cao lên bao nhiêu
     */
    const lastRowExtender = Math.max(0, DECK_ROW_COUNT - currentDeckList.length) + 1;
    const portal = document.getElementById(MODAL_WRAPPER_ID);

    useEffect(() => {
        register(deckId, { type, defaultPhase, phaseBehavior, preset });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    /** [Register DOM Entity] */
    const addDOMEntity = useDOMEntityStateStore(state => state.addDOMEntity);
    const deckButtonRef = useRef<HTMLDivElement | null>(null);
    const deckButtonBeaconListRef = useRef<HTMLDivElement[]>([]);
    useEffect(() => {
        if (deckButtonRef.current && deckButtonBeaconListRef.current) {
            addDOMEntity(deckButtonRef.current, DOMEntityType['deckModal'], deckButtonBeaconListRef.current);
        }
    }, [addDOMEntity]);

    const deckImpoterRef = useRef<DeckImporterRef>(null);

    const beaconProps = {
        deckId,
    };
    const close = () => {
        deckImpoterRef.current?.close();
        onClose?.();
    };
    if (!portal) return null;
    return createPortal(
        <>
            <DeckModalHandleContainer ref={handleRef => setHandle(handleRef)}
                style={{ zIndex: currentZIndex + 1 }}
                className={mergeClass(
                    'deck-modal-handle',
                    isVisible ? 'deck-modal-visible' : 'deck-modal-invisible',
                    className,
                )}
                onMouseDown={e => {
                    e.stopPropagation();
                    focus('modal', deckId);
                }}
                onMouseOver={e => e.stopPropagation()}
                onMouseOut={e => e.stopPropagation()}
            >
                <div className="deck-modal-content">
                    <div className="deck-modal-title-content"><PlayerTag preset={preset} /> {displayName} ({currentFullDeckList.size} / {deckCount ?? 0})</div>
                    <CloseOutlined onClick={close} />
                </div>
                <Moveable
                    target={handle}
                    container={null}

                    /* Resize event edges */
                    edge={false}

                    /* draggable */
                    draggable={true}
                    throttleDrag={0}
                    onDrag={onDrag}
                    onRenderEnd={renderEndBundle => {
                        const { target: handleTarget, transform } = renderEndBundle;
                        const [, rawTranslateX, rawTranslateY] = DragTransformStatRegex.exec(transform) ?? [];
                        let translateX = Number(rawTranslateX);
                        let translateY = Number(rawTranslateY);
                        if (handleTarget && target) {
                            const { x, y, right, height: handleHeight, width: handleWidth } = handleTarget.getBoundingClientRect();
                            const handlePadding = 50; /** Có một khoản thừa nhỏ để đảm bảo người dùng đủ chỗ cầm vào được handle */
                            /**
                             * Nếu modal bị tràn khỏi màn hình, ta ép nó vào lại viewport để đảm bảo khả năng tương tác
                             * 
                             * Ta check đáy trước, để nếu cả đáy và đỉnh đều tràn thì ưu tiên ép vào đỉnh
                             */
                            if (x + handlePadding > window.innerWidth) {
                                handleTarget.style.left = `${window.innerWidth - handlePadding}px`;
                                target.style.left = `${window.innerWidth - handlePadding}px`;
                            }
                            if (y > window.innerHeight) {
                                handleTarget.style.top = `${window.innerHeight - handleHeight}px`;
                                target.style.top = `${window.innerHeight - handleHeight}px`;
                            }
                            if (right - handlePadding < 0) {
                                handleTarget.style.left = `${-handleWidth + handlePadding}px`;
                                target.style.left = `${-handleWidth + handlePadding}px`;
                            }
                            if (y < 0) {
                                handleTarget.style.top = '0px';
                                target.style.top = '0px';
                            }
                        }

                        if (isNaN(translateX) || translateX < 0) translateX = 0;
                        if (isNaN(translateY) || translateY < 0) translateY = 0;

                        recalculateDOMEntity();
                    }}
                />
            </DeckModalHandleContainer>
            <ModalContainer
                ref={targetRef => {
                    setTarget(targetRef);
                    if (targetRef) deckButtonRef.current = targetRef;
                }}
                className={mergeClass(
                    'deck-modal-viewer',
                    isVisible ? 'deck-modal-visible' : 'deck-modal-invisible',
                    isAddingCard ? 'deck-modal-adding' : '',
                    DOM_ENTITY_CLASS, DOMEntityTypeClass['deckModal'],
                    className,
                )}
                style={{ zIndex: currentZIndex }}
                onMouseDown={e => {
                    e.stopPropagation();
                    focus('modal', deckId);
                }}
                onMouseEnter={() => setFocused(true)}
                onMouseLeave={() => setFocused(false)}
                onMouseOver={e => e.stopPropagation()}
                onMouseOut={e => e.stopPropagation()}
                $beaconCount={beaconList?.length}
                {...{
                    [PROP_DOM_ENTITY_NAME]: deckId,
                    [PROP_DOM_ENTITY_TYPE]: DOMEntityType['deckModal'],
                    [PropDOMEntityVisible]: `${isVisible}`,
                }}
            >
                <div className="deck-modal-header-padding" />
                <DeckBeaconWrapper
                    isVisible={isVisible}
                    zIndex={currentZIndex}
                >
                    <div className="deck-modal-beacon-list">
                        {beaconList.map((beaconType, index) => {
                            return <DeckBeacon key={beaconType}
                                ref={ref => {
                                    if (ref) deckButtonBeaconListRef.current[index] = ref;
                                }}
                                {...beaconProps}
                                actionType={beaconType}
                            >
                                {BeaconActionLabel[beaconType].label}
                            </DeckBeacon>;
                        })}
                    </div>
                    <div className="deck-card-list">
                        {currentDeckList.map((deckRow, rowIndex, arr) => {
                            return <Droppable key={rowIndex}
                                droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${deckId}]-[ORIGIN-${type}]-[ROW-${rowIndex}]`}
                                direction="horizontal"
                                isDropDisabled={!isVisible || !isFocused}
                            >
                                {dropProvided => {
                                    return <ModalRowContainer
                                        ref={dropProvided.innerRef}
                                        className="deck-result"
                                        lastRowExtender={arr.length - 1 === rowIndex ? lastRowExtender : 1}
                                        {...dropProvided.droppableProps}
                                    >
                                        <div style={{ display: 'none' }}>{dropProvided.placeholder}</div>
                                        {deckRow.map(entry => {
                                            const { card: deckCard, index } = entry;
                                            const card = deckCard.get('card');
                                            const _id = card.get('_id');
                                            const cardId = `${deckId}-${_id}`;

                                            return <Draggable key={cardId}
                                                index={index}
                                                draggableId={cardId}
                                            >
                                                {(dragProvided, snapshot) => {
                                                    return <DraggableCard
                                                        dragRef={dragProvided.innerRef}
                                                        uniqueId={cardId}
                                                        baseCard={card}
                                                        origin={deckCard.get('origin')}
                                                        phase={deckCard.get('phase')}
                                                        isDragging={snapshot.isDragging}
                                                        onFlip={() => {
                                                            flipInList(deckId, [{ id: _id, phase: 'toggle' }]);
                                                        }}
                                                        onDelete={() => {
                                                            deleteFromList(deckId, [_id]);
                                                        }}
                                                        onDuplicate={() => {
                                                            duplicateInList(deckId, [deckCard]);
                                                        }}
                                                        {...dragProvided.dragHandleProps}
                                                        {...dragProvided.draggableProps}
                                                        className={getDraggingClass(dragProvided.draggableProps.style, snapshot, index)}
                                                        style={getDraggingStyle(dragProvided.draggableProps.style, snapshot)}
                                                    />;
                                                }}
                                            </Draggable>;
                                        })}
                                    </ModalRowContainer>;
                                }}
                            </Droppable>;
                        })}
                    </div>
                </DeckBeaconWrapper>
                <div className="deck-tool-bar">
                    <div>
                        
                    </div>
                    <Button type="ghost" onClick={close}>Close</Button>
                    <Button type="default" onClick={() => shuffleList(deckId)}>Shuffle</Button>
                    <DeckImporter ref={deckImpoterRef}
                        deckId={deckId}
                        preset={preset}
                        onVisibleChange={status => setAddingCard(status)}
                    />
                </div>
            </ModalContainer>
        </>,
        portal,
    );
});