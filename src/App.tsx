import './app.scss';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    BeaconAction,
    CardImageConverter,
    DROP_TYPE_DECK,
    GetDropActionRegex,
    GetDropIDRegex,
    GetDropTypeRegex,
    CLASS_BEACON_DECK_BACK,
    CLASS_BOARD,
    CLASS_BOARD_ACTIVE,
    PROP_BEACON_DECK_ORIGIN,
    PROP_BEACON_ACTION_TYPE,
    DOMEntityTypeClass,
    MODAL_WRAPPER_ID,
    DOMEntityType,
    PropDOMEntityVisible,
    Player,
    YGOProDomainRegex,
    GetDeckTypeRegex,
} from './model';
import { v4 as uuidv4 } from 'uuid';
import { Board, CardBoard, CardPreviewer, ExportButton, ImportButton } from './component';
import { BeforeCapture, DragDropContext, DragStart } from 'react-beautiful-dnd';
import { ExtractProps } from './type';
import { cardIndexQueue, DeckListConverter, useBoardStore, useDeckStore, useDescriptionStore, useDOMEntityStateStore, useLPStore, useZIndexState } from './state';
import { isLieInside } from './util';
import 'antd/dist/antd.less';
import { AppMenuContainer } from './styled';
import { useResizeDetector } from 'react-resize-detector';

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
    const addDescription = useDescriptionStore(state => state.set);
    const registerDeck = useDeckStore(state => state.register);
    const resetDeck = useDeckStore(state => state.reset);
    const resetBoard = useBoardStore(state => state.reset);
    const setLP = useLPStore(state => state.set);
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
    const resetLP = (value = '8000') => [Player.your, Player.opp].map(entry => setLP(entry, value));
    const { ref } = useResizeDetector({
        refreshMode: 'debounce',
        refreshRate: 500,
        onResize: () => {
            console.log('resize');
            recalculate();
        },
    });
    const [hardResetCnt, setHardReset] = useState(0);
    const mousePosition = useRef({ x: 0, y: 0 });
    /**
     * Khi bắt đầu drag, xác định chênh lệch giữa vị trí con trỏ chuột và góc trên trái của element
     * ```
     * X━━━━┑
     * │    │
     * │    │
     * │   x│
     * ┕━━━━┙
     * ```
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

    const currentEventTarget = useRef<HTMLDivElement | null>(null);
    const currentHighlightEvent = useRef<(_e: MouseEvent) => void>(() => { });
    const currentMouseDownEvent = useRef<(_e: MouseEvent) => void>();
    const onBeforeDragStart = (initial: DragStart) => {
        const { source, draggableId } = initial;

        /**
         * Side-effect cho modal, vì handle có index cao hơn modal, card khi drag ngang qua handle sẽ bị khuất, ta cần effect để nâng index của modal lên, rồi hạ xuống sau khi kết thúc drag
         */
        document.querySelector(`[data-rbd-droppable-id="${source.droppableId}"]`)
            ?.closest(`.${DOMEntityTypeClass.deckModal}`)
            ?.classList.add('deck-modal-viewer-boost');
    };

    const onDragStart = (initial: DragStart) => {
        const { source, draggableId } = initial;
        console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragStart');
        /*...*/

        /**
         * Side effect cho Draggable Card để cho phép nó tương tác với các beacon (tương tự như Movable Card)
         */
        currentEventTarget.current = document.querySelector(`[data-rbd-draggable-id="${draggableId}"`);
        currentHighlightEvent.current = ({ clientX, clientY }: MouseEvent) => {
            const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
            let foundWrapper = false;
            for (const DOMEntity of DOMEntityList) {
                const { type, element, beaconList } = DOMEntity;
                const DOMElement = element();
                DOMElement.classList.remove('js-available-to-drop');

                if (foundWrapper) continue;
                if (!isLieInside({ x: clientX, y: clientY }, DOMEntity)) continue;
                if (type === DOMEntityType['deckButton']) {
                    foundWrapper = true;
                    let foundBeacon = false;
                    for (const beacon of beaconList) {
                        beacon.beaconElement().classList.remove('js-ready-to-drop');
                        if (foundBeacon === false && isLieInside({ x: clientX, y: clientY }, beacon)) {
                            foundBeacon = true;
                            beacon.beaconElement().classList.add('js-ready-to-drop');
                        }
                    }
                    DOMElement.classList.add('js-available-to-drop');
                }
            }
        };
        document.addEventListener('mousemove', currentHighlightEvent.current);
    };
    const onDragUpdate = () => {
        console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragUpdate');
        /*...*/
    };
    const onDragEnd: ExtractProps<typeof DragDropContext>['onDragEnd'] = result => {
        console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragEnd');
        const { destination, source } = result;
        const {
            droppableId: sourceDropId,
            index: sourceIndex,
        } = source;
        const {
            droppableId: destinationDropId = '',
            index: destinationIndex = -1,
        } = destination ?? {};
        const cleanEffect = () => {
            document.removeEventListener('mousemove', currentHighlightEvent.current);
            document.querySelector('.deck-modal-viewer-boost')?.classList.remove('deck-modal-viewer-boost');
            const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
            for (const DOMEntity of DOMEntityList) {
                const { element, beaconList } = DOMEntity;
                element().classList.remove('js-available-to-drop');
                for (const beacon of beaconList) {
                    beacon.beaconElement().classList.remove('js-ready-to-drop');
                }
            }
        };

        /** Giả drag, mặc dù ta không dùng droppable, ta lợi dụng event drag-n-drop để thực viện việc drop */
        if (destination == null) {
            const backBeaconList = document.querySelectorAll<HTMLElement>(`.${CLASS_BEACON_DECK_BACK}`);
            let highestBeaconIndex = 0;
            let highestBeaconTarget: HTMLElement | null = null;

            for (let cnt = 0; cnt < backBeaconList.length; cnt++) {
                const backBeacon = backBeaconList[cnt];
                const zIndex = parseInt(backBeacon.style.zIndex ?? '0');
                if (!isNaN(zIndex)
                    && zIndex >= highestBeaconIndex
                    && isLieInside(mousePosition.current, backBeacon.getBoundingClientRect())
                ) {
                    highestBeaconIndex = zIndex;
                    highestBeaconTarget = backBeacon;
                }
            }

            if (highestBeaconTarget) {
                /** Drag vào Deck thông qua beacon từ Deck Button */
                const dropType = highestBeaconTarget.getAttribute(PROP_BEACON_ACTION_TYPE) as BeaconAction | null;
                const beaconOrigin = highestBeaconTarget.getAttribute(PROP_BEACON_DECK_ORIGIN);
                const sourceDeckID = GetDropIDRegex.exec(sourceDropId)?.[1];
                if (dropType && beaconOrigin && sourceDeckID) {
                    const targetDeckCard = currentDeckList.get(sourceDeckID, DeckListConverter()).get('cardList').get(sourceIndex);

                    if (targetDeckCard) {
                        console.log(targetDeckCard.toJS(), beaconOrigin);
                        deleteFromDeck(sourceDeckID, [targetDeckCard.get('card').get('_id')]);
                        addToDeck(
                            beaconOrigin,
                            [{ card: targetDeckCard.get('card'), phase: targetDeckCard.get('phase') }],
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
                    if (!isNaN(zIndex)
                        && zIndex >= highestBoardIndex
                        && isLieInside(mousePosition.current, target.getBoundingClientRect())
                    ) {
                        highestBoardIndex = zIndex;
                        highestBoardTarget = target;
                    }
                }

                if (highestBoardTarget) {
                    const deckID = GetDropIDRegex.exec(sourceDropId)?.[1];
                    const boardName = highestBoardTarget.getAttribute('data-board-name');
                    if (deckID && boardName) {
                        const cardInDeck = currentDeckList.get(deckID, DeckListConverter()).get('cardList').get(sourceIndex);

                        if (deckID && cardInDeck) {
                            const { x, y } = mousePosition.current;
                            const { x: offsetX, y: offsetY } = dragCardOffset.current;
                            const targetCard = cardInDeck.get('card');
                            deleteFromDeck(deckID, [targetCard.get('_id')]);
                            addToBoard(boardName, [{
                                card: targetCard,
                                /** Khi drag lên field thì phải dùng absolute position */
                                initialX: x - offsetX + window.scrollX,
                                initialY: y - offsetY + window.scrollY,
                                origin: deckID,
                                phase: cardInDeck.get('phase'),
                            }]);
                        }
                    }
                }
            }
            cleanEffect();
            return;
        }
        if (destinationDropId === sourceDropId && destinationIndex === sourceIndex) {
            cleanEffect();
            return;
        }

        if (GetDropTypeRegex.exec(sourceDropId)?.[1] === DROP_TYPE_DECK
            && GetDropTypeRegex.exec(destinationDropId)?.[1] === DROP_TYPE_DECK
        ) {
            const sourceDeckID = GetDropIDRegex.exec(sourceDropId)?.[1];
            const destinationDeckID = GetDropIDRegex.exec(destinationDropId)?.[1];

            if (sourceDeckID && destinationDeckID) {
                if (sourceDeckID === destinationDeckID) {
                    /** Drag cục bộ trong Deck */
                    if (sourceDeckID) reorder(sourceDeckID, [{
                        prevIndex: sourceIndex,
                        nextIndex: destinationIndex,
                    }]);
                } else {
                    const targetDeckCard = currentDeckList.get(sourceDeckID, DeckListConverter()).get('cardList').get(sourceIndex);
                    const dropActionType = GetDropActionRegex.exec(destinationDropId)?.[1];
                    if (targetDeckCard) {
                        if (dropActionType) {
                            /** Drag từ Deck này sang Deck khác thông qua Beacon */
                            addToDeck(
                                destinationDeckID,
                                [{ card: targetDeckCard.get('card'), phase: targetDeckCard.get('phase') }],
                                dropActionType as BeaconAction,
                            );
                        } else {
                            /** Drag từ Deck này sang Deck khác bằng thao tác trực tiếp */
                            addToDeckInPosition(destinationDeckID, [{
                                card: targetDeckCard,
                                position: destinationIndex,
                            }]);
                        }
                        deleteFromDeck(sourceDeckID, [targetDeckCard.get('card').get('_id')]);
                    }
                }
            }
        }
        cleanEffect();
    };

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
            resetLP();
        }, 500);

        return () => {
            document.removeEventListener('mousemove', getMousePosition);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hardResetCnt]);

    useLayoutEffect(() => {
        /**
         * Sau khi hard reset ta cũng mất thông tin của DOMEntity, vậy nên phải recalculate
         */
        recalculate();
    }, [zIndexChange, recalculate, hardResetCnt]);

    const boardName = 'main-board';
    return (
        <DragDropContext
            onBeforeCapture={onBeforeCapture}
            onBeforeDragStart={onBeforeDragStart}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
        >
            <div key={`board-${hardResetCnt}`} ref={ref}
                className="app-wrapper"
                style={{
                    backgroundImage: `url("${process.env.PUBLIC_URL}/asset/img/texture/debut-dark.png"), linear-gradient(180deg, #00000022, #00000044)`,
                }}
            >
                <CardPreviewer>
                    <AppMenuContainer>
                        <ExportButton />
                        <ImportButton onImport={importedData => {
                            resetDeck();
                            resetBoard();
                            resetLP();
                            Object.entries(importedData.deckList).forEach(([deckName, { type, cardList, defaultPhase, phaseBehavior, preset }]) => {
                                const validEntryList = cardList.filter(entry => (entry ?? '').length > 0);
                                registerDeck(deckName, { type, defaultPhase, phaseBehavior, preset });
                                addToDeck(
                                    deckName,
                                    validEntryList
                                        .map(imageURL => ({
                                            card: CardImageConverter({
                                                _id: uuidv4(),
                                                dataURL: imageURL,
                                                type: 'external',
                                                preset,
                                                isOfficial: YGOProDomainRegex.test(imageURL),
                                            }),
                                        })),
                                );
                            });
                            addDescription(
                                Object.entries(importedData.descriptionMap).map(([url, description]) => ({ key: url, description })),
                                true,
                            );
                            setHardReset(cnt => cnt + 1);
                        }} />
                    </AppMenuContainer>
                </CardPreviewer>
                <div className="board-container">
                    <Board boardName={boardName} />
                </div>
                <div className="padding" />
            </div>
            <CardBoard boardName={boardName} />
        </DragDropContext>
    );
}

export default App;
