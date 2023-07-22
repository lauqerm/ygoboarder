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
    DOMEntityType,
    Player,
    YGOProDomainRegex,
    DEFAULT_LP,
} from './model';
import { v4 as uuidv4 } from 'uuid';
import {
    Board,
    CardBoard,
    CardPreviewer,
    ExportButton,
    BoardHotkeyController,
    ImportButton,
    Manual,
    GlobalHotkeyController,
    CardPreviewerModal,
} from './component';
import { BeforeCapture, DragDropContext, DragStart } from 'react-beautiful-dnd';
import { ExtractProps } from './type';
import {
    DeckListConverter,
    useBoardState,
    useCounterState,
    useDeckState,
    useDescriptionState,
    useDOMEntityState,
    useDroppableAvailableState,
    useLPState,
    useYGOProFilter,
    useZIndexState,
} from './state';
import { isLieInside } from './util';
import { AppMenuContainer } from './styled';
import { useResizeDetector } from 'react-resize-detector';
import { notification } from 'antd';
import 'antd/dist/antd.less';

function App() {
    const currentDeckList = useDeckState(
        state => state.deckMap,
        (oldState, newState) => oldState.equals(newState),
    );
    const initCardList = useYGOProFilter(state => state.init);

    const reorder = useDeckState(state => state.reorder);
    const deleteFromDeck = useDeckState(state => state.delete);
    const addToDeckInPosition = useDeckState(state => state.addToPosition);
    const addToDeck = useDeckState(state => state.add);
    const addDescription = useDescriptionState(state => state.set);
    const registerDeck = useDeckState(state => state.register);
    const resetDeck = useDeckState(state => state.reset);

    const resetBoard = useBoardState(state => state.reset);
    const addToBoard = useBoardState(state => state.add);

    const switchCounterMode = useCounterState(state => state.setCounterMode);

    const setLP = useLPState(state => state.set);

    const zIndexChange = useZIndexState(state => state.updateCount);

    const updateModalStatus = useDroppableAvailableState(state => state.update);
    const recalculate = useDOMEntityState(state => state.recalculate);
    const resetLP = (value = `${DEFAULT_LP}`) => [Player.your, Player.opp].map(entry => setLP(entry, value));
    const { ref } = useResizeDetector<HTMLDivElement>({
        refreshMode: 'debounce',
        refreshRate: 500,
        onResize: () => {
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
    const onBeforeDragStart = (initial: DragStart) => {
        const { source } = initial;

        /**
         * Side-effect cho modal, vì handle có index cao hơn modal, card khi drag ngang qua handle sẽ bị khuất, ta cần effect để nâng index của modal lên, rồi hạ xuống sau khi kết thúc drag
         */
        const targetModal = document.querySelector(`[data-rbd-droppable-id="${source.droppableId}"]`)
            ?.closest(`.${DOMEntityTypeClass.deckModal}`);
        /** Do cách render của component ta luôn assume header luôn ở ngay trước body */
        const targetModalHeader = targetModal?.previousElementSibling;

        targetModal?.classList.add('deck-modal-viewer-boost');
        targetModalHeader?.classList.add('deck-modal-header-viewer-boost');
    };

    const onDragStart = (initial: DragStart) => {
        const { source, draggableId } = initial;
        // console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragStart', source);
        /*...*/

        /**
         * Side effect cho Draggable Card để cho phép nó tương tác với các beacon (tương tự như Movable Card)
         */
        currentEventTarget.current = document.querySelector(`[data-rbd-draggable-id="${draggableId}"`);
        currentHighlightEvent.current = ({ clientX, clientY }: MouseEvent) => {
            const DOMEntityList = useDOMEntityState.getState().DOMEntityList;
            const sourceDeckName = GetDropIDRegex.exec(source.droppableId)?.[1] ?? '';
            const sourceDOMEntity = DOMEntityList.find(entry => entry.name === sourceDeckName);
            /**
             * Một hack nhỏ. Vì source modal được tự động nâng lên zIndex tối đa để đảm bảo card đang drag không bị che, điều này sẽ làm xáo trộn thứ tự của DOMEntityList, vốn được sắp xếp giảm dần theo zIndex. Ta sẽ build một list tạm để giải quyết vấn đề này.
             */
            const normalizedDOMEntityList = sourceDOMEntity
                ? [sourceDOMEntity, ...DOMEntityList.filter(entry => entry.name !== sourceDeckName)]
                : DOMEntityList;
            let foundWrapper = false;
            for (const DOMEntity of normalizedDOMEntityList) {
                const { name, type, element, beaconList } = DOMEntity;
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
                } else if (type === DOMEntityType['deckModal']) {
                    foundWrapper = true;
                    updateModalStatus(() => ({
                        [sourceDeckName]: true,
                        [name]: true,
                    }));
                }
            }
        };
        document.addEventListener('mousemove', currentHighlightEvent.current);
    };
    const onDragUpdate = () => {
        // console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragUpdate');
        /*...*/
    };
    const onDragEnd: ExtractProps<typeof DragDropContext>['onDragEnd'] = result => {
        // console.log('🚀 ~ Draggable ~ onBeforeCapture ~ onDragEnd', result);
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
            document.querySelector('.deck-modal-header-viewer-boost')?.classList.remove('deck-modal-header-viewer-boost');
            const DOMEntityList = useDOMEntityState.getState().DOMEntityList;
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
                                phase: 'up', /** Ưu tiên UX, nếu đúng thì phase của card mới phải tuân theo original phase của nó (dùng cardInDeck.get('phase')) */
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
                            /** Drag từ modal Deck này sang modal Deck khác */
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
        const turnOffCounterMode = (e: MouseEvent) => {
            if (useCounterState.getState().activeCounter) e.preventDefault();
            switchCounterMode(undefined);
        };

        const getMousePosition = (e: MouseEvent) => {
            mousePosition.current = {
                x: e.pageX,
                y: e.pageY,
            };
        };
        document.addEventListener('mousemove', getMousePosition);
        document.addEventListener('contextmenu', turnOffCounterMode);
        setTimeout(() => {
            recalculate();
            resetLP();
            ref.current?.focus();
        }, 500);

        return () => {
            document.removeEventListener('mousemove', getMousePosition);
            document.removeEventListener('contextmenu', turnOffCounterMode);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hardResetCnt]);

    useEffect(() => {
        let relevant = true;

        (async () => {
            try {
                await initCardList();
            } catch (e) {
                if (relevant) {
                    notification.error({
                        message: 'Could not load card data',
                        description: 'Please refresh the page',
                        placement: 'bottomRight',
                    });
                }
            }
        })();

        return () => {
            relevant = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useLayoutEffect(() => {
        /**
         * Sau khi hard reset ta cũng mất thông tin của DOMEntity, vậy nên phải recalculate
         */
        recalculate();
    }, [zIndexChange, recalculate, hardResetCnt]);

    const boardName = 'main-board';
    return (
        <BoardHotkeyController>
            <GlobalHotkeyController />
            <DragDropContext
                onBeforeCapture={onBeforeCapture}
                onBeforeDragStart={onBeforeDragStart}
                onDragStart={onDragStart}
                onDragUpdate={onDragUpdate}
                onDragEnd={onDragEnd}
            >
                <div key={`board-${hardResetCnt}`} ref={ref}
                    tabIndex={-1}
                    className="app-wrapper"
                    style={{
                        backgroundImage: `url("${process.env.PUBLIC_URL}/asset/img/texture/debut-dark.png"), linear-gradient(180deg, #00000022, #00000044)`,
                    }}
                >
                    <CardPreviewerModal />
                    <CardPreviewer>
                        <AppMenuContainer>
                            <Manual />
                            <ExportButton />
                            <ImportButton onImport={importedData => {
                                resetDeck();
                                resetBoard();
                                resetLP();
                                Object.entries(importedData.deckList).forEach(([
                                    deckName,
                                    { type, cardList, defaultPhase, phaseBehavior, preset },
                                ]) => {
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
                                        undefined,
                                        true,
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
        </BoardHotkeyController>
    );
}

export default App;
