import logo from './logo.svg';
import './app.scss';
import { Input, Upload } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BeaconAction, CardImage, CardImageConverter, DECK_ROW_COUNT, DeckType, DROP_TYPE_BOARD, DROP_TYPE_DECK, GetDropActionRegex, GetDropIDRegex, GetDropTypeRegex, GetOriginRegex, CLASS_BEACON_DECK_BACK, CLASS_BOARD, CLASS_BOARD_ACTIVE, PROP_BEACON_DECK_ORIGIN, PROP_BEACON_ACTION_TYPE, DOMEntityType } from './model';
import { v4 as uuidv4 } from 'uuid';
import { Board, Card, CardBoard, DeckButton, DeckModal, ExportButton, ImportButton, MovableCard } from './component';
import { BeforeCapture, DragDropContext, DragStart } from 'react-beautiful-dnd';
import { ExtractProps } from './type';
import { cardIndexQueue, DeckCard, DeckListConverter, useBoardStore, useCardEventStore, useDeckStore, useDOMEntityStateStore, useZIndexState } from './state';
import debounce from 'lodash.debounce';
import { List } from 'immutable';
import 'antd/dist/antd.less';
import { deactivateAllBeacon } from './service';
import { isLieInside } from './util';

function App() {
    const appRef = useRef<HTMLDivElement>(null);
    const currentDeckList = useDeckStore(
        state => state.deckMap,
        (oldState, newState) => oldState.equals(newState),
    );
    const reorder = useDeckStore(state => state.reorder);
    const deleteFromDeck = useDeckStore(state => state.delete);
    const addToBoard = useBoardStore(state => state.add);
    const addToDeckInPosition = useDeckStore(state => state.addToPosition);
    const addToDeck = useDeckStore(state => state.add);
    const registerDeck = useDeckStore(state => state.register);
    const resetDeck = useDeckStore(state => state.reset);
    const resetBoard = useBoardStore(state => state.reset);
    const cardDraggedFromDeckButtonToBoard = useCardEventStore(
        state => state.dragFromDeckButtonToBoardData,
        (prev, next) => prev._index === next._index,
    );
    const zIndexChange = useZIndexState(state => state.updateCount);
    const {
        recalculate,
        DOMEntityList,
    } = useDOMEntityStateStore(
        ({ DOMEntityList, recalculate, recalculateCount }) => ({
            DOMEntityList,
            recalculate,
            version: recalculateCount,
        }),
        (prev, next) => prev.version === next.version,
    );
    const [hardResetCnt, setHardReset] = useState(0);
    const mousePosition = useRef({ x: 0, y: 0 });
    /**
     * Khi bắt đầu drag, xác định chênh lệch giữa vị trí con trỏ chuột và góc trên trái của element
     * ┍━━━━┑
     * │    │
     * │    │
     * │   x│
     * ┕━━━━┙
     */
    const dragCardOffset = useRef({ x: 0, y: 0 });

    const onBeforeCapture = (before: BeforeCapture) => {
        const { draggableId } = before;
        const targetCard = document.querySelector(`[data-countable-card-id="${draggableId}"]`);

        if (targetCard) {
            const { top: cardTop, left: cardLeft } = targetCard.getBoundingClientRect();
            const { x, y } = mousePosition.current;
            dragCardOffset.current = {
                x: x - cardLeft,
                y: y - cardTop,
            };
        }
        /*...*/
    };

    const onBeforeDragStart = (initial: DragStart) => {
        const { draggableId, source } = initial;
        console.log('🚀 ~ Draggable ~ onBeforeDragStart ~ draggableId', source);
        /**
         * Side-effect cho DeckButton
        */
        appRef.current
            ?.querySelector(`[data-rbd-droppable-id="${source.droppableId}"]`)
            ?.closest('.deck-beacon-wrapper')
            ?.querySelector('.deck-back-beacon-list')
            ?.classList.add('deck-back-beacon-suppress');
        appRef.current?.classList.add('app-wrapper-is-dragging');
    };

    const onDragStart = () => {
        console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragStart');
        /*...*/
    };
    const onDragUpdate = () => {
        console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragUpdate');
        /*...*/
    };
    const onDragEnd: ExtractProps<typeof DragDropContext>['onDragEnd'] = result => {
        console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragEnd');
        const { destination, source, draggableId } = result;
        const cleanUpEffects = () => {
            appRef.current?.classList.remove('app-wrapper-is-dragging');
            deactivateAllBeacon();
        };

        /** Giả drag, mặc dù ta không dùng droppable, ta lợi dụng event drag-n-drop để thực viện việc drop */
        if (destination == null) {
            const backBeaconList = document.querySelectorAll<HTMLElement>(`.${CLASS_BEACON_DECK_BACK}`);
            let highestBeaconIndex = 0;
            let highestBeaconTarget: HTMLElement | null = null;

            for (let cnt = 0; cnt < backBeaconList.length; cnt++) {
                const target = backBeaconList[cnt];
                const zIndex = parseInt(target.style.zIndex ?? '0');
                if (!isNaN(zIndex) && zIndex >= highestBeaconIndex) {
                    const { top, left, right, bottom } = target.getBoundingClientRect();
                    const { x, y } = mousePosition.current;

                    if (x >= left && x <= right && y >= top && y <= bottom) {
                        highestBeaconIndex = zIndex;
                        highestBeaconTarget = target;
                    }
                }
            }

            if (highestBeaconTarget) {
                /** Drag vào Deck thông qua beacon từ Deck Back */
                const dropType = highestBeaconTarget.getAttribute(PROP_BEACON_ACTION_TYPE) as BeaconAction | null;
                const beaconOrigin = highestBeaconTarget.getAttribute(PROP_BEACON_DECK_ORIGIN);
                const sourceDeckID = GetDropIDRegex.exec(source.droppableId)?.[1];
                if (dropType && beaconOrigin && sourceDeckID) {
                    const targetDeckCard = currentDeckList.get(sourceDeckID, DeckListConverter()).get('cardList').get(source.index);

                    if (targetDeckCard) {
                        deleteFromDeck(sourceDeckID, [targetDeckCard.get('card').get('_id')]);
                        addToDeck(
                            beaconOrigin,
                            [targetDeckCard.get('card')],
                            dropType,
                        );
                    }
                }
            } else {
                /** Drag vào board */
                const playBoardList = document.querySelectorAll<HTMLElement>(`.${CLASS_BOARD}.${CLASS_BOARD_ACTIVE}`);
                let highestBoardIndex = 0;
                let highestBoardTarget: HTMLElement | null = null;

                for (let cnt = 0; cnt < playBoardList.length; cnt++) {
                    const target = playBoardList[cnt];
                    const zIndex = parseInt(target.style.zIndex ?? '0');
                    if (!isNaN(zIndex) && zIndex >= highestBoardIndex) {
                        const { top, left, right, bottom } = target.getBoundingClientRect();
                        const { x, y } = mousePosition.current;

                        if (x >= left && x <= right && y >= top && y <= bottom) {
                            highestBoardIndex = zIndex;
                            highestBoardTarget = target;
                        }
                    }
                }

                if (highestBoardTarget) {
                    const deckID = GetDropIDRegex.exec(source.droppableId)?.[1];
                    const boardName = highestBoardTarget.getAttribute('data-board-name');
                    if (deckID && boardName) {
                        const cardInDeck = currentDeckList.get(deckID, DeckListConverter()).get('cardList').get(source.index);

                        if (deckID && cardInDeck) {
                            const { x, y } = mousePosition.current;
                            const { x: offsetX, y: offsetY } = dragCardOffset.current;
                            const targetCard = cardInDeck.get('card');
                            deleteFromDeck(deckID, [targetCard.get('_id')]);
                            addToBoard(boardName, [{
                                card: targetCard,
                                initialX: x - 0 - offsetX,
                                initialY: y - 0 - offsetY,
                                origin: deckID,
                            }]);
                        }
                    }
                }
            }
            cleanUpEffects();
            return;
        }
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            cleanUpEffects();
            return;
        }
        const sourceType = GetDropTypeRegex.exec(source.droppableId)?.[1];
        const destinationType = GetDropTypeRegex.exec(destination.droppableId)?.[1];

        if (sourceType === DROP_TYPE_DECK && destinationType === DROP_TYPE_DECK) {
            const sourceDeckID = GetDropIDRegex.exec(source.droppableId)?.[1];
            const destinationDeckID = GetDropIDRegex.exec(destination.droppableId)?.[1];

            if (sourceDeckID && destinationDeckID) {
                if (sourceDeckID === destinationDeckID) {
                    /** Drag cục bộ trong Deck */
                    if (sourceDeckID) reorder(sourceDeckID, [{
                        prevIndex: source.index,
                        nextIndex: destination.index,
                    }]);
                } else {
                    const targetDeckCard = currentDeckList.get(sourceDeckID, DeckListConverter()).get('cardList').get(source.index);
                    const dropActionType = GetDropActionRegex.exec(destination.droppableId)?.[1];
                    if (targetDeckCard) {
                        if (dropActionType) {
                            /** Drag từ Deck này sang Deck khác thông qua Beacon */
                            addToDeck(
                                destinationDeckID,
                                [targetDeckCard.get('card')],
                                dropActionType as BeaconAction,
                            );
                        } else {
                            /** Drag từ Deck này sang Deck khác bằng thao tác trực tiếp */
                            addToDeckInPosition(destinationDeckID, [{
                                card: targetDeckCard,
                                position: destination.index,
                            }]);
                        }
                        deleteFromDeck(sourceDeckID, [targetDeckCard.get('card').get('_id')]);
                    }
                }
            }
        }
        cleanUpEffects();
    };

    const getDroppedBeacon = () => {
        const backBeaconList = document.querySelectorAll<HTMLElement>(`.${CLASS_BEACON_DECK_BACK}`);
        let highestBeaconIndex = 0;
        let highestBeaconTarget: HTMLElement | null = null;

        for (let cnt = 0; cnt < backBeaconList.length; cnt++) {
            const target = backBeaconList[cnt];
            const zIndex = parseInt(target.style.zIndex ?? '0');
            if (!isNaN(zIndex) && zIndex >= highestBeaconIndex) {
                const { top, left, right, bottom } = target.getBoundingClientRect();
                const { x, y } = mousePosition.current;

                if (x >= left && x <= right && y >= top && y <= bottom) {
                    highestBeaconIndex = zIndex;
                    highestBeaconTarget = target;
                }
            }
        }

        return highestBeaconTarget;
    };
    const dragFromDeckButtonToBoard = () => {
        if (cardDraggedFromDeckButtonToBoard._index >= 0 && getDroppedBeacon() === null) {
            const { x, y } = mousePosition.current;
            for (const DOMEntity of DOMEntityList) {
                const { type, element } = DOMEntity;

                if (type === DOMEntityType['board'] && isLieInside({ x, y }, DOMEntity)) {
                    const { cardIndex, deckID } = cardDraggedFromDeckButtonToBoard;
                    const boardName = element.getAttribute('data-board-name');
                    if (deckID && boardName) {
                        const cardInDeck = currentDeckList.get(deckID, DeckListConverter()).get('cardList').get(cardIndex);
    
                        if (deckID && cardInDeck) {
                            const { x: offsetX, y: offsetY } = dragCardOffset.current;
                            const targetCard = cardInDeck.get('card');
                            deleteFromDeck(deckID, [targetCard.get('_id')]);
                            addToBoard(boardName, [{
                                card: targetCard,
                                initialX: x - 0 - offsetX,
                                initialY: y - 0 - offsetY,
                                origin: deckID,
                            }]);
                        }
                    }
                    break;
                }
            }
        }
        deactivateAllBeacon();
    };

    useEffect(() => {
        dragFromDeckButtonToBoard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardDraggedFromDeckButtonToBoard._index]);

    useEffect(() => {
        const getMousePosition = (e: MouseEvent) => {
            mousePosition.current = {
                x: e.pageX,
                y: e.pageY,
            };
        };
        document.addEventListener('mousemove', getMousePosition);
        setTimeout(() => {
            recalculate();
        }, 500);

        return () => {
            document.removeEventListener('mousemove', getMousePosition);
        };
    }, [recalculate]);

    useEffect(() => {
        recalculate();
    }, [zIndexChange, recalculate]);

    return (
        <DragDropContext
            onBeforeCapture={onBeforeCapture}
            onBeforeDragStart={onBeforeDragStart}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
        >
            <div>Test queue
                <button onClick={() => cardIndexQueue.toTop('A')}>A top top</button>
                <button onClick={() => cardIndexQueue.toTop('B')}>B top top</button>
                <button onClick={() => cardIndexQueue.toTop('C')}>C top top</button>
                <button onClick={() => cardIndexQueue.toTop('D')}>D top top</button>
                <button onClick={() => recalculate()}>Force recal</button>
            </div>
            <div key={`board-${hardResetCnt}`} ref={appRef} className="app-wrapper">
                <ExportButton />
                <ImportButton onImport={importedData => {
                    resetDeck();
                    resetBoard();
                    Object.entries(importedData).forEach(([deckName, { type, value }]) => {
                        registerDeck(deckName, type);
                        addToDeck(deckName, value.filter(entry => entry.length > 0).map(cardURL => CardImageConverter({
                            _id: uuidv4(),
                            dataURL: cardURL,
                            type: 'external',
                        })));
                    });
                    setHardReset(cnt => cnt + 1);
                    /**
                     * Sau khi hard reset ta cũng mất thông tin của DOMEntity, vậy nên phải recalculate
                     */
                    recalculate();
                }} />
                <Board boardName="main-board" />
                <div className="padding" />
            </div>
            <CardBoard boardName="main-board" />
        </DragDropContext>
    );
}

export default App;
