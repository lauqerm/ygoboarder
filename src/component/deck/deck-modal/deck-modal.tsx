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
    CLASS_PREVENT_DRAG_EVENT,
} from 'src/model';
import { DeckBeacon, DeckBeaconWrapper } from '../deck-beacon';
import {
    DeckCard,
    DeckListConverter,
    ZIndexInstanceConverter,
    useCountState,
    useDeckState,
    useZIndexState,
    useDOMEntityState,
    PhaseBehavior,
    useDroppableAvailableState,
} from 'src/state';
import { DeckImporterDrawerRef } from '../deck-import';
import { DeckModalHandleContainer, DECK_MODAL_HEIGHT, DECK_MODAL_WIDTH, ModalContainer, ModalRowContainer } from './deck-modal-styled';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { ExtractProps } from 'src/type';
import { List } from 'immutable';
import { createPortal } from 'react-dom';
import { mergeClass } from 'src/util';
import { PlayerTag } from 'src/component/atom';
import { DeckModalHotkeyController } from 'src/component/hotkey';
import { getDraggingClass, getDraggingStyle } from './dnd-styling';
import './deck-modal.scss';

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

export type DeckModalRef = {
    shuffle: () => void,
    focusModal: () => void,
};
export type DeckModal = {
    className?: string,
    deckName: string,
    displayName: string,
    isVisible?: boolean,
    isAdding?: boolean,
    type: DeckType,
    defaultPhase: PhaseType,
    phaseBehavior: PhaseBehavior,
    preset: CardPreset,
    onClose?: () => void,
    onOpenImporter: (deckName: string, preset: CardPreset) => void,
    beaconList?: BeaconAction[],
};
export const DeckModal = React.forwardRef(({
    className,
    deckName,
    displayName,
    isAdding = false,
    isVisible = false,
    type,
    defaultPhase,
    phaseBehavior,
    preset,
    onClose,
    onOpenImporter,
    beaconList = [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
}: DeckModal, ref: React.ForwardedRef<DeckModalRef>) => {
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    const [handle, setHandle] = useState<HTMLDivElement | null>(null);
    const deckData = useDeckState(
        state => state.deckMap.get(deckName, DeckListConverter()),
        (oldState, newState) => oldState.equals(newState),
    );
    const currentFullDeckList = deckData.get('cardList');
    const deckCardListRef = useRef<HTMLDivElement>(null);
    const deckCount = useCountState(state => state.countMap[deckName]);
    const recalculateDOMEntity = useDOMEntityState(state => state.recalculate);
    const isAllowDrop = useDroppableAvailableState(state => state.statusMap[deckName]) ?? false;

    const {
        register,
        deleteFromList,
        duplicateInList,
        shuffleList,
        groupList,
        flipInList,
    } = useDeckState(
        state => ({
            register: state.register,
            addToList: state.add,
            deleteFromList: state.delete,
            duplicateInList: state.duplicate,
            shuffleList: state.shuffle,
            groupList: state.group,
            flipInList: state.flip,
        }),
        () => true,
    );
    const {
        modalInstance,
        focus,
    } = useZIndexState(
        state => ({
            modalInstance: state.categoryMap['modal'].queueMap.get(deckName, ZIndexInstanceConverter()),
            focus: state.toTop,
        }),
        (prev, next) => {
            return prev.modalInstance.get('name') === next.modalInstance.get('name')
                && prev.modalInstance.get('zIndex') === next.modalInstance.get('zIndex');
        },
    );
    const currentZIndex = modalInstance.get('zIndex');

    const onDrag = useCallback(({
        inputEvent,
        stopDrag,
        target: handleTarget,
        left, top,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDrag']>>[0]) => {
        if (inputEvent.target?.classList.contains(CLASS_PREVENT_DRAG_EVENT)
        || inputEvent.target.parentElement?.classList.contains(CLASS_PREVENT_DRAG_EVENT)) {
            stopDrag();
        } else {
            handleTarget!.style.left = `${left}px`;
            handleTarget!.style.top = `${top}px`;

            target!.style.left = `${left}px`;
            target!.style.top = `${top}px`;
        }
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
        register(deckName, { type, defaultPhase, phaseBehavior, preset });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const focusModal = () => {
        if (isVisible) deckCardListRef.current?.focus();
    };
    /** Focus tự động vào element bên trong hotkey để kích hoạt hotkey */
    useEffect(() => {
        focusModal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    /** [Register DOM Entity] */
    const addDOMEntity = useDOMEntityState(state => state.addDOMEntity);
    const deckModalRef = useRef<HTMLDivElement | null>(null);
    const deckButtonBeaconListRef = useRef<HTMLDivElement[]>([]);
    useEffect(() => {
        if (deckModalRef.current && deckButtonBeaconListRef.current) {
            addDOMEntity(deckModalRef.current, DOMEntityType['deckModal'], deckButtonBeaconListRef.current);
        }
    }, [addDOMEntity]);

    useImperativeHandle(ref, () => ({
        shuffle: () => {
            shuffleList(deckName);
        },
        focusModal,
    }));

    const deckImpoterRef = useRef<DeckImporterDrawerRef>(null);

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
                    focus('modal', deckName);
                }}
                onMouseOver={e => e.stopPropagation()}
                onMouseOut={e => e.stopPropagation()}
            >
                <div className="deck-modal-content">
                    <div className="deck-modal-title-content">
                        <PlayerTag
                            preset={preset}
                        /> {displayName} {type !== 'none' && type !== 'permanent' ? `(${currentFullDeckList.size} / ${deckCount ?? 0})` : ''}
                    </div>
                    <div className="deck-tool-bar">
                        <Button className={CLASS_PREVENT_DRAG_EVENT} size="small" type="default" onClick={() => shuffleList(deckName)}>
                            {'Shuffle'}
                        </Button>
                        <Button className={CLASS_PREVENT_DRAG_EVENT} size="small" type="default" onClick={() => groupList(deckName)}>
                            {'Group'}
                        </Button>
                        <Button className={CLASS_PREVENT_DRAG_EVENT} size="small" type="primary" onClick={() => onOpenImporter(deckName, preset)}>
                            {'Add'}
                        </Button>
                        <CloseOutlined className={CLASS_PREVENT_DRAG_EVENT} onClick={close} />
                    </div>
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
                    if (targetRef) deckModalRef.current = targetRef;
                }}
                className={mergeClass(
                    'deck-modal-viewer',
                    isVisible ? 'deck-modal-visible' : 'deck-modal-invisible',
                    isAdding ? 'deck-modal-adding' : '',
                    DOM_ENTITY_CLASS, DOMEntityTypeClass['deckModal'],
                    className,
                )}
                style={{ zIndex: currentZIndex }}
                onMouseUp={e => {
                    e.stopPropagation();
                    focus('modal', deckName);
                }}
                onMouseOver={e => e.stopPropagation()}
                onMouseOut={e => e.stopPropagation()}
                $beaconCount={beaconList?.length}
                {...{
                    [PROP_DOM_ENTITY_NAME]: deckName,
                    [PROP_DOM_ENTITY_TYPE]: DOMEntityType['deckModal'],
                    [PropDOMEntityVisible]: `${isVisible}`,
                }}
            >
                <div className="deck-modal-header-padding" />
                <DeckModalHotkeyController
                    handlerMap={{
                        CLOSE: () => close(),
                        SHUFFLE: () => shuffleList(deckName),
                        GROUP: () => groupList(deckName),
                        ADD_CARD: () => onOpenImporter(deckName, preset),
                    }}
                >
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
                                    deckName={deckName}
                                    actionType={beaconType}
                                >
                                    {BeaconActionLabel[beaconType].label}
                                </DeckBeacon>;
                            })}
                        </div>
                        <div ref={deckCardListRef} className="deck-card-list" tabIndex={0}>
                            {currentDeckList.length === 0 && <Droppable key={0}
                                droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${deckName}]-[DECK-TYPE-${type}]-[ROW-${0}]`}
                                direction="horizontal"
                                isDropDisabled={!isAllowDrop || !isVisible}
                            >
                                {dropProvided => {
                                    return <ModalRowContainer
                                        ref={dropProvided.innerRef}
                                        className="deck-result"
                                        lastRowExtender={4}
                                        {...dropProvided.droppableProps}
                                    />;
                                }}
                            </Droppable>}
                            {currentDeckList.map((deckRow, rowIndex, arr) => {
                                return <Droppable key={rowIndex}
                                    droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${deckName}]-[DECK-TYPE-${type}]-[ROW-${rowIndex}]`}
                                    direction="horizontal"
                                    isDropDisabled={!isAllowDrop || !isVisible}
                                // isDropDisabled={!isVisible || !isFocused}
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
                                                const cardId = `${deckName}-${_id}`;

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
                                                                flipInList(deckName, [{ id: _id, phase: 'toggle' }]);
                                                            }}
                                                            onDelete={() => {
                                                                deleteFromList(deckName, [_id], true);
                                                            }}
                                                            onDuplicate={() => {
                                                                if (type !== 'permanent' && type !== 'none') duplicateInList(deckName, [deckCard]);
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
                </DeckModalHotkeyController>
            </ModalContainer>
        </>,
        portal,
    );
});