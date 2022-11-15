import logo from './logo.svg';
import './app.css';
import { Input, Upload } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BEACON_ACTION, CardImage, CardImageConverter, DECK_ROW_COUNT, DECK_TYPE, DROP_TYPE_BOARD, DROP_TYPE_DECK, GetDropActionRegex, GetDropIDRegex, GetDropTypeRegex, GetOriginRegex } from './model';
import { v4 as uuidv4 } from 'uuid';
import { Board, Card, DeckButton, DeckModal, ExportButton, ImportButton, MovableCard } from './component';
import { BeforeCapture, DragDropContext, DragStart } from 'react-beautiful-dnd';
import { ExtractProps } from './type';
import { DeckCard, DeckListConverter, useBoardStore, useDeckStore } from './state';
import debounce from 'lodash.debounce';
import { List } from 'immutable';

function App() {
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
    };

    const onDragStart = () => {
        /*...*/
    };
    const onDragUpdate = () => {
        /*...*/
    };
    const onDragEnd: ExtractProps<typeof DragDropContext>['onDragEnd'] = result => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
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
        /** Drag từ Deck ra Board */
        if (sourceType === DROP_TYPE_DECK && destinationType === DROP_TYPE_BOARD) {
            const deckID = GetDropIDRegex.exec(source.droppableId)?.[1];
            const boardID = GetDropIDRegex.exec(destination.droppableId)?.[1];
            if (deckID && boardID) {
                const cardInDeck = currentDeckList.get(deckID, DeckListConverter()).get('cardList').get(source.index);
                const targetBoard = document.querySelector(`[data-board-id="${boardID}"]`);

                if (deckID && cardInDeck && targetBoard) {
                    const { top: boardTop, left: boardLeft } = targetBoard.getBoundingClientRect();
                    const { x, y } = mousePosition.current;
                    const { x: offsetX, y: offsetY } = dragCardOffset.current;
                    const targetCard = cardInDeck.get('card');
                    addToBoard(boardID, [{
                        card: targetCard,
                        initialX: x - boardLeft - offsetX,
                        initialY: y - boardTop - offsetY,
                        origin: deckID,
                    }]);
                    deleteFromDeck(deckID, [targetCard.get('_id')]);
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
            <div key={`board-${hardResetCnt}`} className="app-wrapper">
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
                <DeckButton type="permanent" name="DECK" />
                <DeckButton type="consistent" name="TRUNK" />
                <DeckButton type="transient" name="GY" />
                <Board />
            </div>
        </DragDropContext>
    );
}

export default App;
