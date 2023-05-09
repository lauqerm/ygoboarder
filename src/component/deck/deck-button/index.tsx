import { useEffect, useRef, useState } from 'react';
import { DeckModal } from '..';
import { DeckBeacon, DeckBeaconWrapper } from '../deck-beacon';
import {
    BeaconAction,
    BeaconActionLabel,
    CardPreset,
    CLASS_BEACON_DECK_BACK,
    DOM_ENTITY_CLASS,
    DOMEntityType,
    DOMEntityTypeClass,
    PROP_DOM_ENTITY_NAME,
    PROP_DOM_ENTITY_TYPE,
    DECK_BUTTON_INDEX,
    MODAL_WRAPPER_ID,
    BoardComponent,
    ActionListPlacement,
    CardSize,
    PhaseType,
} from 'src/model';
import {
    DeckListConverter,
    ZIndexInstanceConverter,
    useDeckStore,
    useZIndexState,
    useDOMEntityStateStore,
    useBoardStore,
    DeckCard,
} from 'src/state';
import styled from 'styled-components';
import {
    EyeOutlined,
    RetweetOutlined,
    CopyOutlined,
    CopyFilled,
    ToTopOutlined,
    VerticalAlignTopOutlined,
    VerticalAlignMiddleOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { DeckModalRef } from '../deck-modal/deck-modal';
import { List } from 'immutable';
import { MovableCard } from '../../card';
import { mergeClass } from 'src/util';
import { createPortal } from 'react-dom';
import { BoardIcon } from '../../atom';
import './deck-button.scss';
import { DeckButtonAnnouncer, DeckButtonAnnouncerRef } from './deck-button-announce';

const DeckButtonToolbar = styled.div<{ $placement?: ActionListPlacement }>`
    display: block;
    column-gap: var(--spacing-xs);
    pointer-events: all;
    position: absolute;
    margin-top: var(--spacing);
    top: 0;
    ${props => props.$placement === 'left'
        ? 'right: 100%;'
        : 'left: calc(100% - 1px);'}
    .deck-button-tool {
        flex: 1;
        padding: var(--spacing-xs);
        line-height: 1;
        text-align: center;
        background-color: var(--main-metal);
        border: var(--bd);
        user-select: none;
        cursor: pointer;
        width: 34px;
        color: var(--color-contrast);
        ${props => props.$placement === 'left'
        ? `
            &:first-child {
                border-top-left-radius: var(--br);
            }
            &:last-child {
                border-bottom-left-radius: var(--br);
            }
        `
        : `
            &:first-child {
                border-top-right-radius: var(--br);
            }
            &:last-child {
                border-bottom-right-radius: var(--br);
            }
        `}
        + .deck-button-tool {
            border-top: none;
        }
        &:hover {
            background-color: var(--dim-metal);
            box-shadow: 0 0 1px 1px #222 inset;
        }
    }
`;
const DeckButtonContainer = styled.div<{ $preset: CardPreset, $beaconCount: number, $top?: number, $left?: number }>`
    text-align: center;
    position: absolute;
    top: ${props => `${props.$top}px`};
    left: ${props => `${props.$left}px`};
    display: ${props => typeof props.$left === 'number' && typeof props.$top === 'number' ? 'inline-flex' : 'none'};
    line-height: 0;
    z-index: 1;
    pointer-events: none;
    .deck-back {
        height: var(--card-height);
        width: var(--card-width);
        background-size: contain;
        background-repeat: no-repeat;
        position: relative;
        .deck-back-beacon-list {
            position: relative;
            height: var(--card-height);
            width: 0;
            display: inline-block;
            z-index: 1;
            .deck-beacon {
                height: ${props => `calc(var(--card-height) / ${props.$beaconCount})`};
                width: var(--card-width);
            }
        }
    }
    .top-card {
        display: inline-block;
        height: var(--card-height);
        width: var(--card-width);
        vertical-align: bottom;
        img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    }
    .deck-button-info {
        display: inline-block;
        position: absolute;
        background: var(--main-primaryLighter);
        font-weight: bold;
        text-align: center;
        border: var(--bd);
        border-radius: var(--br);
        padding: 0 var(--spacing-sm);
        margin-top: var(--spacing-xs);
        left: 50%;
        transform: translateX(-50%);
    }
`;

export type DeckButton = {
    offsetTop?: number, offsetLeft?: number,
    /** Board name chứa deck button */
    owner: string,
} & Pick<DeckModal, 'beaconList'>
    & BoardComponent;
export const DeckButton = ({
    name,
    displayName = name,
    owner,
    type,
    fieldComponentKey,
    preset = 'your',
    offsetTop, offsetLeft,
    beaconList = [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
    action,
    actionPlacement,
    defaultPhase,
    phaseBehavior,
}: DeckButton) => {
    const [isVisible, setVisible] = useState(false);
    const deckModalRef = useRef<DeckModalRef>(null);
    const beaconListRef = useRef<HTMLDivElement>(null);

    const {
        hide,
        focus,
        modalInstance,
    } = useZIndexState(
        state => ({
            modalInstance: state.categoryMap['modal'].queueMap.get(name, ZIndexInstanceConverter()),
            hide: state.reset,
            focus: state.toTop,
        }),
        (prev, next) => prev.modalInstance.get('name') === next.modalInstance.get('name')
            && prev.modalInstance.get('zIndex') === next.modalInstance.get('zIndex'),
    );
    const zIndex = modalInstance.get('zIndex');

    const addToBoard = useBoardStore(state => state.add);

    const deleteFromDeck = useDeckStore(state => state.delete);
    const deckList = useDeckStore(
        state => state.deckMap.get(name, DeckListConverter()).get('cardList', List()),
        (oldState, newState) => oldState.equals(newState),
    );
    const topDeckCard = deckList.get(0);

    /** [Register DOM Entity] */
    const addDOMEntity = useDOMEntityStateStore(state => state.addDOMEntity);
    const deckButtonRef = useRef<HTMLDivElement>(null);
    const deckButtonBeaconListRef = useRef<HTMLDivElement[]>([]);
    useEffect(() => {
        if (deckButtonRef.current && deckButtonBeaconListRef.current) {
            addDOMEntity(deckButtonRef.current, DOMEntityType['deckButton'], deckButtonBeaconListRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const announcerRef = useRef<DeckButtonAnnouncerRef>(null);

    const portal = document.getElementById(MODAL_WRAPPER_ID);
    const excavateCard = (card?: DeckCard, phase?: PhaseType) => {
        if (card) {
            const cardOffsetX = CardSize.sm.width + 40 + Math.random() * 40;
            const cardOffsetY = -20 + Math.random() * 40;
            const cardImage = card.get('card');
            deleteFromDeck(name, [cardImage.get('_id')]);
            addToBoard(owner, [{
                card: cardImage,
                initialX: (offsetLeft ?? 0) + (actionPlacement === 'left' ? cardOffsetX * -1 : cardOffsetX),
                initialY: (offsetTop ?? 0) + cardOffsetY,
                origin: name,
                phase: phase ?? card.get('phase'),
            }]);

            return true;
        }
        return false;
    };
    if (!portal) return null;
    return createPortal(
        <DeckButtonContainer ref={deckButtonRef}
            className={mergeClass('deck-button', DOM_ENTITY_CLASS, DOMEntityTypeClass['deckButton'])}
            $preset={preset}
            $beaconCount={beaconList.length}
            $top={offsetTop ?? 0}
            $left={offsetLeft ?? 0}
            data-deck-button-name={name}
            style={{ zIndex: DECK_BUTTON_INDEX }}
            {...{
                [PROP_DOM_ENTITY_NAME]: name,
                [PROP_DOM_ENTITY_TYPE]: DOMEntityType['deckButton'],
            }}
        >
            <DeckButtonToolbar className="deck-button-toolbar" style={{ zIndex: 2 }} $placement={actionPlacement}>
                {action.includes('view') && <Tooltip overlay="View" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-view" onClick={() => {
                            setVisible(true);
                            focus('modal', name);
                        }}
                    >
                        <EyeOutlined />
                    </div>
                </Tooltip>}
                {action.includes('shuffle') && <Tooltip overlay="Shuffle" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-shuffle"
                        onClick={() => deckModalRef.current?.shuffle()}
                    >
                        <RetweetOutlined />
                    </div>
                </Tooltip>}
                {action.includes('excavate-top-faceup') && <Tooltip overlay="Excavate Top" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-excavate-top-faceup"
                        onClick={() => {
                            if (!excavateCard(deckList.get(0), 'up')) announcerRef.current?.trigger('No cards left');
                        }}
                    >
                        <ToTopOutlined />
                    </div>
                </Tooltip>}
                {action.includes('get-top') && <Tooltip overlay="Get Top" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-get-top"
                        onClick={() => {
                            if (!excavateCard(deckList.get(0))) announcerRef.current?.trigger('No cards left');
                        }}
                    >
                        <VerticalAlignTopOutlined />
                    </div>
                </Tooltip>}
                {action.includes('get-random') && <Tooltip overlay="Get Random" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-get-random"
                        onClick={() => {
                            if (!excavateCard(deckList.get(Math.floor(deckList.size)))) announcerRef.current?.trigger('No cards left');
                        }}
                    >
                        <VerticalAlignMiddleOutlined />
                    </div>
                </Tooltip>}
                {action.includes('get-random-faceup') && <Tooltip overlay="Get Random Face-up" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-get-random-face-up"
                        onClick={() => {
                            const faceUpDeckList = deckList
                                .filter(entry => entry.get('phase') === 'up');
                            if (!excavateCard(faceUpDeckList.get(Math.floor(faceUpDeckList.size)))) announcerRef.current?.trigger('No face-up cards');
                        }}
                    >
                        <CopyOutlined />
                        <VerticalAlignMiddleOutlined />
                    </div>
                </Tooltip>}
                {action.includes('get-random-facedown') && <Tooltip overlay="Get Random Face-down" placement={actionPlacement}>
                    <div
                        className="deck-button-tool deck-button-tool-get-random-face-down"
                        onClick={() => {
                            const faceUpDeckList = deckList
                                .filter(entry => entry.get('phase') === 'down');
                            if (!excavateCard(faceUpDeckList.get(Math.floor(faceUpDeckList.size)))) announcerRef.current?.trigger('No face-down cards');
                        }}
                    >
                        <CopyFilled />
                        <VerticalAlignMiddleOutlined />
                    </div>
                </Tooltip>}
            </DeckButtonToolbar>
            <DeckBeaconWrapper
                className="deck-back ygo-card-size-sm"
                style={{ zIndex: 1 }}
                zIndex={zIndex}
                isVisible={true}
            >
                <div ref={beaconListRef} className="deck-back-beacon-list">
                    {beaconList.map((beaconAction, index) => {
                        return <DeckBeacon key={beaconAction}
                            ref={ref => {
                                if (ref) deckButtonBeaconListRef.current[index] = ref;
                            }}
                            actionType={beaconAction}
                            className={CLASS_BEACON_DECK_BACK}
                            style={{ zIndex: 1 }}
                            deckId={name}
                        >
                            {BeaconActionLabel[beaconAction].shortLabel}
                        </DeckBeacon>;
                    })}
                </div>
                <div className="top-card">
                    {topDeckCard
                        ? <MovableCard key={topDeckCard.get('card').get('_id')}
                            uniqueId={`[DECKBUTTON-${name}]-[ID-${topDeckCard.get('card').get('_id')}]`}
                            baseCard={topDeckCard.get('card')}
                            origin={topDeckCard.get('origin')}
                            originEntity={DOMEntityType['deckButton']}
                            initialX={offsetLeft}
                            initialY={offsetTop}
                            phase={topDeckCard.get('phase')}
                            fake={true}
                            onDragToBoard={(_id, coord, _origin, boardName) => {
                                const cardInDeck = deckList.get(0);

                                if (cardInDeck) {
                                    const { left, top } = coord;
                                    const targetCard = cardInDeck.get('card');
                                    deleteFromDeck(name, [targetCard.get('_id')]);
                                    addToBoard(boardName, [{
                                        card: targetCard,
                                        initialX: left,
                                        initialY: top,
                                        origin: name,
                                        phase: cardInDeck.get('phase'),
                                    }]);
                                }
                            }}
                            onMouseEnter={() => {
                                deckButtonRef.current?.classList.add('deck-button-force-show');
                            }}
                            onMouseLeave={() => {
                                deckButtonRef.current?.classList.remove('deck-button-force-show');
                            }}
                        />
                        : <BoardIcon
                            size="sm"
                            type={fieldComponentKey}
                            onMouseEnter={() => {
                                deckButtonRef.current?.classList.add('deck-button-force-show');
                            }}
                            onMouseLeave={() => {
                                deckButtonRef.current?.classList.remove('deck-button-force-show');
                            }}
                        />}
                </div>
                <DeckButtonAnnouncer ref={announcerRef} />
            </DeckBeaconWrapper>
            {/* <div className="deck-button-info" style={{ zIndex: 1 + 1 }}>
            {displayName}
        </div> */}
            <DeckModal ref={deckModalRef}
                isVisible={isVisible}
                deckId={name}
                displayName={displayName}
                type={type}
                defaultPhase={defaultPhase}
                phaseBehavior={phaseBehavior}
                preset={preset}
                beaconList={beaconList}
                onClose={() => {
                    setVisible(false);
                    hide('modal', name);
                }}
            />
        </DeckButtonContainer>,
        portal,
    );
};