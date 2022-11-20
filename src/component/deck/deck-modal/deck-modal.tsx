import Moveable from 'react-moveable';
import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { DraggableCard } from '../../card';
import { DROP_TYPE_DECK, DECK_ROW_COUNT, DragTransformStatRegex, DeckType } from 'src/model';
import { DeckBeacon } from '../deck-beacon';
import { DeckCard, DeckListConverter, ModalInstanceConverter, useCountStore, useDeckStore, useModalStore } from 'src/state';
import { DeckImporter } from './deck-import';
import { DeckModalHandleContainer, DECK_MODAL_HEIGHT, DECK_MODAL_WIDTH, ModalContainer } from './deck-modal-styled';
import { Droppable, Draggable, DraggableStateSnapshot, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';
import { ExtractProps } from 'src/type';
import { List } from 'immutable';
import { createPortal } from 'react-dom';
import { mergeClass } from 'src/util';
import './deck-modal.scss';

const distributeDeckRow = (cardList: List<DeckCard>) => {
    const processedDeckRow: { card: DeckCard, index: number }[][] = [];
    let currentRowList: { card: DeckCard, index: number }[] = [];
    let currentCounter = 0;

    cardList.forEach(entry => {
        currentRowList.push({ card: entry, index: currentCounter });

        if ((1 + currentCounter) % DECK_ROW_COUNT === 0) {
            processedDeckRow.push(currentRowList);
            currentRowList = [];
        }
        currentCounter += 1;
    });
    if (currentRowList.length !== 0) processedDeckRow.push(currentRowList);

    return processedDeckRow;
};

function getStyle(style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot): React.CSSProperties | undefined {
    if (snapshot.isDropAnimating && snapshot.dropAnimation) {
        const { curve } = snapshot.dropAnimation;

        return {
            ...style,
            visibility: snapshot.isDropAnimating ? 'hidden' : 'visible',
            /** Skip hết mức transition để giảm giật layout */
            transition: `all ${curve} 0.001s, visibility 0s`,
        };
    }
    return style;
}

export type DeckModalRef = {
    shuffle: () => void,
};
export type DeckModal = {
    className?: string,
    deckId: string,
    isVisible?: boolean,
    type: DeckType,
    onClose?: () => void,
};
export const DeckModal = React.forwardRef(({
    className,
    deckId,
    isVisible = false,
    type,
    onClose,
}: DeckModal, ref: React.ForwardedRef<DeckModalRef>) => {
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    const [handle, setHandle] = useState<HTMLDivElement | null>(null);
    const deckData = useDeckStore(
        state => state.deckMap.get(deckId, DeckListConverter()),
        (oldState, newState) => oldState.equals(newState),
    );
    const currentFullDeckList = deckData.get('cardList');
    const deckCount = useCountStore(state => state.countMap[deckId]);

    const {
        register,
        deleteFromList,
        duplicateInList,
        shuffleList,
    } = useDeckStore(
        state => ({
            register: state.register,
            addToList: state.add,
            deleteFromList: state.delete,
            duplicateInList: state.duplicate,
            shuffleList: state.shuffle,
        }),
        () => true,
    );
    const {
        modalInstance,
        focus,
    } = useModalStore(
        state => ({
            modalInstance: state.modalMap.get(deckId, ModalInstanceConverter()),
            focus: state.increase,
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
        target!.style.left = `${left}px`;
        handleTarget!.style.left = `${left}px`;
        target!.style.top = `${top}px`;
        handleTarget!.style.top = `${top}px`;
    }, [target]);

    useEffect(() => {
        if (target && handle) {
            const initialLeft = Math.max(0, window.innerWidth - DECK_MODAL_WIDTH) / 2;
            const initialTop = Math.max(0, window.innerHeight - DECK_MODAL_HEIGHT) / 2;

            target.style.left = `${initialLeft}px`;
            handle.style.left = `${initialLeft}px`;
            target.style.top = `${initialTop}px`;
            handle.style.top = `${initialTop}px`;
        }
    }, [target, handle]);

    const currentDeckList = distributeDeckRow(currentFullDeckList);
    const portal = document.getElementById('modal-wrapper');

    useEffect(() => {
        register(deckId, type);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const beaconProps = {
        deckId,
        isVisible,
        zIndex: currentZIndex,
    };
    if (!portal) return null;
    return createPortal(
        <>
            <DeckModalHandleContainer ref={handleRef => setHandle(handleRef)}
                style={{ zIndex: currentZIndex }}
                className={mergeClass(
                    'deck-modal-handle',
                    isVisible ? 'deck-modal-visible' : 'deck-modal-invisible',
                    className,
                )}
                onMouseDown={e => {
                    e.stopPropagation();
                    focus(deckId);
                }}
            >
                <div className="deck-modal-content">
                    <div>{deckId}</div>
                    <CloseOutlined onClick={onClose} />
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
                            // const { height, width } = target.getBoundingClientRect();
                            /**
                             * Nếu modal bị tràn khỏi màn hình, ta ép nó vào lại viewport để đảm bảo khả năng tương tác
                             * 
                             * Ta check đáy trước, để nếu cả đáy và đỉnh đều tràn thì ưu tiên đỉnh
                             */
                            if (right > window.innerWidth) {
                                handleTarget.style.left = `${window.innerWidth - handleWidth}px`;
                                target.style.left = `${window.innerWidth - handleWidth}px`;
                            }
                            if (y > window.innerHeight) {
                                handleTarget.style.top = `${window.innerHeight - handleHeight}px`;
                                target.style.top = `${window.innerHeight - handleHeight}px`;
                            }
                            if (x < 0) {
                                handleTarget.style.left = '0px';
                                target.style.left = '0px';
                            }
                            if (y < 0) {
                                handleTarget.style.top = '0px';
                                target.style.top = '0px';
                            }
                        }

                        if (isNaN(translateX) || translateX < 0) translateX = 0;
                        if (isNaN(translateY) || translateY < 0) translateY = 0;

                        // target!.style.left = `${translateX}px`;
                        // target!.style.top = `${translateY}px`;
                        // handleTarget!.style.left = `${translateX}px`;
                        // handleTarget!.style.top = `${translateY}px`;
                    }}
                />
            </DeckModalHandleContainer>
            <ModalContainer
                ref={targetRef => {
                    setTarget(targetRef);
                }}
                data-entity-type={DROP_TYPE_DECK}
                className={mergeClass(
                    'deck-modal-viewer',
                    isVisible ? 'deck-modal-visible' : 'deck-modal-invisible',
                    className,
                )}
                style={{ zIndex: currentZIndex }}
                onMouseDown={e => {
                    e.stopPropagation();
                    focus(deckId);
                }}
            >
                <div className="deck-modal-beacon-list">
                    <DeckBeacon {...beaconProps} actionType="top">Add to top</DeckBeacon>
                    <DeckBeacon {...beaconProps} actionType="shuffle">Add and shuffle</DeckBeacon>
                    <DeckBeacon {...beaconProps} actionType="bottom">Add to bottom</DeckBeacon>
                </div>
                <div className="deck-card-list">
                    {currentDeckList.map((deckRow, rowIndex) => {
                        return <Droppable key={rowIndex}
                            droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${deckId}]-[ORIGIN-${type}]-[ROW-${rowIndex}]`}
                            direction="horizontal"
                        >
                            {dropProvided => {
                                return <div
                                    ref={dropProvided.innerRef}
                                    className="deck-result"
                                    {...dropProvided.droppableProps}
                                >
                                    {deckRow.map(entry => {
                                        const { card: deckCard, index } = entry;
                                        const card = deckCard.get('card');
                                        const origin = deckCard.get('origin');
                                        const _id = card.get('_id');
                                        const cardId = `${deckId}-${_id}`;

                                        return <Draggable key={cardId}
                                            index={index}
                                            draggableId={cardId}
                                        >
                                            {(dragProvided, snapshot) => {
                                                return <DraggableCard ref={dragProvided.innerRef}
                                                    uniqueId={cardId}
                                                    image={card}
                                                    origin={origin}
                                                    onDelete={() => {
                                                        deleteFromList(deckId, [_id]);
                                                    }}
                                                    onDuplicate={() => {
                                                        duplicateInList(deckId, [deckCard]);
                                                    }}
                                                    {...dragProvided.dragHandleProps}
                                                    {...dragProvided.draggableProps}
                                                    style={getStyle(dragProvided.draggableProps.style, snapshot)}
                                                />;
                                            }}
                                        </Draggable>;
                                    })}
                                    {dropProvided.placeholder}
                                </div>;
                            }}
                        </Droppable>;
                    })}
                </div>
                <div className="deck-tool-bar">
                    <div>
                        Card amount: {currentFullDeckList.size} / {deckCount ?? 0}
                    </div>
                    <Button type="ghost" onClick={onClose}>Close</Button>
                    <Button type="default" onClick={() => shuffleList(deckId)}>Shuffle</Button>
                    <DeckImporter deckId={deckId} />
                </div>
            </ModalContainer>
        </>,
        portal,
    );
});