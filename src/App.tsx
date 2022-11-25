import logo from './logo.svg';
import './app.scss';
import { Input, Upload } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BEACON_ACTION, CardImage, CardImageConverter, DECK_ROW_COUNT, DeckType, DROP_TYPE_BOARD, DROP_TYPE_DECK, GetDropActionRegex, GetDropIDRegex, GetDropTypeRegex, GetOriginRegex, CLASS_BEACON_DECK_BACK, CLASS_BOARD } from './model';
import { v4 as uuidv4 } from 'uuid';
import { Board, Card, DeckButton, DeckModal, ExportButton, ImportButton, MovableCard } from './component';
import { BeforeCapture, DragDropContext, DragStart } from 'react-beautiful-dnd';
import { ExtractProps } from './type';
import { DeckCard, DeckListConverter, useBoardStore, useDeckStore } from './state';
import debounce from 'lodash.debounce';
import { List } from 'immutable';
import 'antd/dist/antd.less';

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
        const { draggableId } = initial;
        /*...*/
        appRef.current?.classList.add('app-wrapper-is-dragging');
    };

    const onDragStart = () => {
        /*...*/
    };
    const onDragUpdate = () => {
        /*...*/
    };
    const onDragEnd: ExtractProps<typeof DragDropContext>['onDragEnd'] = result => {
        appRef.current?.classList.remove('app-wrapper-is-dragging');
        const { destination, source, draggableId } = result;

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
                const dropType = highestBeaconTarget.getAttribute('data-beacon-type') as BEACON_ACTION | null;
                const beaconOrigin = highestBeaconTarget.getAttribute('data-deck-origin');
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
                const playBoardList = document.querySelectorAll<HTMLElement>(`.${CLASS_BOARD}`);
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
                        const targetBoard = document.querySelector(`[data-board-name="${boardName}"]`);
    
                        if (deckID && cardInDeck && targetBoard) {
                            console.log('TO BOARD', deckID, boardName);
                            const { top: boardTop, left: boardLeft } = targetBoard.getBoundingClientRect();
                            const { x, y } = mousePosition.current;
                            const { x: offsetX, y: offsetY } = dragCardOffset.current;
                            const targetCard = cardInDeck.get('card');
                            deleteFromDeck(deckID, [targetCard.get('_id')]);
                            addToBoard(boardName, [{
                                card: targetCard,
                                initialX: x - boardLeft - offsetX,
                                initialY: y - boardTop - offsetY,
                                origin: deckID,
                            }]);
                        }
                    }
                }
            }
            return;
        }
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
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
                                dropActionType as BEACON_ACTION,
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
    };

    useEffect(() => {
        const getMousePosition = (e: MouseEvent) => {
            mousePosition.current = {
                x: e.pageX,
                y: e.pageY,
            };
        };
        document.addEventListener('mousemove', getMousePosition);

        return () => {
            document.removeEventListener('mousemove', getMousePosition);
        };
    });

    return (
        <DragDropContext
            onBeforeCapture={onBeforeCapture}
            onBeforeDragStart={onBeforeDragStart}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
        >
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
                }} />
                <Board boardName="main-board">
                    <DeckButton type="permanent" name="DECK" />
                    <DeckButton type="consistent" name="TRUNK" />
                    <DeckButton type="transient" name="GY" />
                </Board>
                <div className="padding" />
            </div>
        </DragDropContext>
    );
}

export default App;
