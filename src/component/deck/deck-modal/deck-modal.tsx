import { Button, Input } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardImageConverter, DROP_TYPE_DECK, DECK_ROW_COUNT, DROP_TYPE_DECK_BEACON, DragTransformStatRegex, DECK_TYPE } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { CountableCard } from '../../card';
import { Droppable, Draggable, DraggableStateSnapshot, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';
import { DeckCard, DeckList, DeckListConverter, ModalInstanceConverter, useDeckStore, useModalStore } from 'src/state';
import { List } from 'immutable';
import Moveable from 'react-moveable';
import './deck-modal.scss';
import { ExtractProps } from 'src/type';
import { createPortal } from 'react-dom';
import { mergeClass } from 'src/util';
import styled from 'styled-components';
import { DeckBeacon } from '../deck-beacon';
import axios from 'axios';
import { ImgurResponse } from 'src/model/imgur';
import { DeckImporter } from './deck-import';

const DECK_MODAL_WIDTH = 700;
const DECK_MODAL_HEIGHT = 400;
const ModalContainer = styled.div`
    width: ${DECK_MODAL_WIDTH}px;
    height: ${DECK_MODAL_HEIGHT}px;
`;

const getDeckRow = (cardList: List<DeckCard>) => {
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
    if (!snapshot.isDropAnimating || !snapshot.dropAnimation) {
        return style;
    }
    const { moveTo, curve, duration } = snapshot.dropAnimation;
    // move to the right spot
    const translate = 'translate(0px, 0px)';
    // add a bit of turn for fun
    const rotate = 'rotate(0.5turn)';

    // patching the existing style
    return {
        ...style,
        transform: `${translate} ${rotate}`,
        visibility: snapshot.isDropAnimating ? 'hidden' : 'visible',
        // slowing down the drop because we can
        transition: `all ${curve} 0.001s, visibility 0.001s`,
    };
}

export type DeckModal = {
    deckId: string,
    className?: string,
    type: DECK_TYPE,
};
export const DeckModal = ({
    deckId,
    className,
    type,
}: DeckModal) => {
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    const [handle, setHandle] = useState<HTMLDivElement | null>(null);
    const [uploadCnt, setUploadCnt] = useState(0);
    const resetUpload = () => setUploadCnt(cnt => cnt + 1);
    const targetRef = useRef<HTMLDivElement>(null);
    const currentFullDeckList = useDeckStore(
        state => state.deckMap.get(deckId, DeckListConverter()).get('cardList'),
        (oldState, newState) => oldState.equals(newState),
    );
    const {
        register,
        addToList,
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
        (prev, next) => prev.modalInstance.get('name') === next.modalInstance.get('name')
        && prev.modalInstance.get('zIndex') === next.modalInstance.get('zIndex'),
    );
    const currentZIndex = modalInstance.get('zIndex');
    console.log('🚀 ~ file: deck-modal.tsx ~ line 109 ~ currentZIndex', currentZIndex);
    const [onlineInputKey, setOnlineInputKey] = useState(0);
    const onlineImageValue = useRef('');
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            for (let cnt = 0, finishedCount = 0; cnt < e.target.files.length; cnt++) {
                const target = e.target.files[cnt];
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    if (typeof reader.result === 'string') {
                        addToList(
                            deckId,
                            [CardImageConverter({
                                _id: uuidv4(),
                                name: target.name,
                                type: 'internal',
                                data: reader.result as string,
                                dataURL: '',
                            })],
                        );
                        finishedCount++;
                        if (typeof e.target.files?.length !== 'number' || (finishedCount === e.target.files?.length)) resetUpload();
                    }
                });
                reader.readAsDataURL(target);
                // const imgurFormData = new FormData();
                // imgurFormData.append('image', target);
                // axios.post<ImgurResponse>(
                //     'https://api.imgur.com/3/image',
                //     imgurFormData,
                //     {

                //         headers: {
                //             'Authorization': 'Client-ID f9bbe0da263580e',
                //         },
                //     },
                // ).then(response => {
                //     console.log(response);
                // }).catch(e => {
                //     console.error(e);
                // });
            }
        }
    };

    const onDrag = useCallback(({
        target: handleTarget,
        transform, left, top,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDrag']>>[0]) => {
        // target!.style.transform = transform;
        // handleTarget!.style.transform = transform;
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

    const currentDeckList = getDeckRow(currentFullDeckList);
    const portal = document.getElementById('modal-wrapper');

    useEffect(() => {
        register(deckId, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!portal) return null;
    return createPortal(
        <>
            <div ref={handleRef => setHandle(handleRef)}
                style={{ padding: 10, position: 'absolute', zIndex: currentZIndex }}
                className={mergeClass('deck-modal-handle', className)}
                onMouseDown={e => {
                    e.stopPropagation();
                    focus(deckId);
                }}
            >
                Handle
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
                        const { target: handleTarget, transform, clientX, clientY } = renderEndBundle;
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
            </div>
            <ModalContainer
                ref={targetRef => {
                    setTarget(targetRef);
                }}
                data-entity-type={DROP_TYPE_DECK}
                className={mergeClass('deck-modal-viewer', className)}
                style={{ zIndex: currentZIndex }}
                onMouseDown={e => {
                    e.stopPropagation();
                    focus(deckId);
                }}
            >
                <DeckImporter deckId={deckId} />
                <button onClick={() => shuffleList(deckId)}>Shuffle</button>
                <div className="deck-beacon">
                    <DeckBeacon deckId={deckId} zIndex={currentZIndex} actionType="top">Add to top</DeckBeacon>
                    <DeckBeacon deckId={deckId} zIndex={currentZIndex} actionType="shuffle">Add and shuffle</DeckBeacon>
                    <DeckBeacon deckId={deckId} zIndex={currentZIndex} actionType="bottom">Add to bottom</DeckBeacon>
                </div>
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
                                        draggableId={cardId}
                                        index={index}
                                    >
                                        {(dragProvided, snapshot) => {
                                            return <CountableCard ref={dragProvided.innerRef}
                                                uniqueId={cardId}
                                                image={card}
                                                origin={origin}
                                                onDelete={() => {
                                                    deleteFromList(deckId, [_id]);
                                                }}
                                                onDuplicate={() => {
                                                    duplicateInList(deckId, [deckCard]);
                                                }}
                                                {...dragProvided.draggableProps}
                                                {...dragProvided.dragHandleProps}
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
            </ModalContainer>
        </>,
        portal,
    );
};