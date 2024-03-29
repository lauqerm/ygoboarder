import { useEffect, useRef } from 'react';
import {
    FieldComponentKey,
    NeutalFieldComponentKey,
    FieldDeckCoordinateMap,
    FieldKey,
    NeutralFieldKey,
    getBoardComponent,
} from 'src/model';
import styled from 'styled-components';
import { CardBack, FieldIcon, PendulumIcon } from '../atom';
import { DeckListConverter, useCounterState, useDeckState } from 'src/state';
import { CounterWidget, LPWidget, RandomWidget, TurnWidget } from '../widget';
import { getAbsoluteRect } from 'src/util';

const BoardContainer = styled.div`
    /** 2px cho border, 4px cho padding */
    --zone-card-height-sm: calc(var(--card-height-sm) + 2px);
    --zone-card-width-sm: calc(var(--card-width-sm) + 2px);
    --field-card-height-sm: calc(var(--card-height-sm) + 4px + 2px);
    --field-card-width-sm: calc(var(--card-width-sm) + 4px + 2px);

    display: inline-grid;
    grid-template-columns: max-content max-content max-content;
    column-gap: var(--spacing-xl);
    padding: var(--spacing-3xl) var(--spacing-xl);
    .side-col {
        display: inline-grid;
        grid-template-columns: 1fr;
        grid-template-rows: min-content 1fr min-content;
        .side-col-component {
            display: inline-grid;
            grid-template-columns: 1fr;
            row-gap: var(--spacing-xl);
        }
    }
    .main-col {
        display: inline-grid;
        grid-template-columns: 1fr;
        grid-template-rows: 100px min-content min-content min-content 100px;
        .main-col-field,
        .main-col-center {
            background-color: var(--main-contrast);
            border: var(--bd-contrast);
            column-gap: var(--bdSize);
            display: inline-flex;
            flex-wrap: wrap;
            row-gap: var(--bdSize);
            width: calc(var(--field-card-height-sm) * 5 + var(--bdSize) * 4 + var(--bdSize) * 2);
        }
        .main-col-center {
            border-top: none;
            border-bottom: none;
            border-left-color: transparent;
            border-right-color: transparent;
            background-color: transparent;
            > .square-zone {
                box-shadow: 0 0 0 var(--bdSize) var(--bdColor-contrast);
            }
        }
        .main-extra-section {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
    }
    .square-zone {
        /** 4px cho padding */
        width: calc(var(--zone-card-height-sm) + 4px);
        height: calc(var(--zone-card-height-sm) + 4px);
        background-color: var(--main-secondaryLighter);
    }
    .vertical-zone {
        width: var(--zone-card-width-sm);
        height: var(--zone-card-height-sm);
        background-color: var(--main-secondaryLighter);
        border: var(--bd-contrast);
        &.hidden-zone {
            visibility: hidden;
        }
        &.pile {
            border-color: var(--main-primaryLighter);
        }
        &.trunk {
            border-color: var(--main-primaryLighter);
            background-color: var(--main-primary);
        }
    }
    .empty-zone {
        width: var(--field-card-height-sm);
    }
    .with-icon {
        display: flex;
        svg {
            width: 60%;
            color: #fafafa;
            margin: auto;
        }
    }
    .token {
        width: calc(var(--deck-button-simple-width) + 2px);
        height: calc(var(--deck-button-simple-height) + 2px);
        margin: var(--spacing-xs) 0;
        margin-left: 45px;
        background-color: var(--main-secondaryLighter);
        border: var(--bd-contrast);
    }
    .left-extra-section {
        display: flex;
        align-items: center;
        .turn-widget {
            flex: 1;
        }
    }
`;

export type BoardDrawing = {
    onCoordinateChnage: (boardCoordinateMap: Record<FieldKey | NeutralFieldKey, FieldDeckCoordinateMap | undefined>) => void,
}
export const BoardDrawing = ({
    onCoordinateChnage,
}: BoardDrawing) => {
    const activeCounter = useCounterState(state => state.activeCounter);

    const boardRef = useRef<HTMLDivElement>(null);

    const tokenPileRef = useRef<HTMLDivElement>(null);

    const oppTrunkRef = useRef<HTMLDivElement>(null);
    const oppExtraDeckRef = useRef<HTMLDivElement>(null);
    const oppBanishedPileRef = useRef<HTMLDivElement>(null);
    const oppGYRef = useRef<HTMLDivElement>(null);
    const oppDeckRef = useRef<HTMLDivElement>(null);

    const yourTrunkRef = useRef<HTMLDivElement>(null);
    const yourExtraDeckRef = useRef<HTMLDivElement>(null);
    const yourBanishedPileRef = useRef<HTMLDivElement>(null);
    const yourGYRef = useRef<HTMLDivElement>(null);
    const yourDeckRef = useRef<HTMLDivElement>(null);

    const deckCountMap = useDeckState(state => state.deckMap);

    const oldCoord = useRef({ x: 0, y: 0 });
    useEffect(() => {
        /** Coordinate này relative với viewport */
        const rect = boardRef.current?.getBoundingClientRect();
        const { x = 0, y = 0 } = rect ? getAbsoluteRect(rect) : {};
        if (x !== oldCoord.current.x || y !== oldCoord.current.y) {
            oldCoord.current = { x, y };
            onCoordinateChnage({
                [NeutralFieldKey.neutral]: {
                    [NeutalFieldComponentKey.tokenPile]: tokenPileRef.current
                        ? getAbsoluteRect(tokenPileRef.current.getBoundingClientRect())
                        : undefined,
                },
                [FieldKey.your]: {
                    [FieldComponentKey.deck]: yourDeckRef.current
                        ? getAbsoluteRect(yourDeckRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.extraDeck]: yourExtraDeckRef.current
                        ? getAbsoluteRect(yourExtraDeckRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.trunk]: yourTrunkRef.current
                        ? getAbsoluteRect(yourTrunkRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.gy]: yourGYRef.current
                        ? getAbsoluteRect(yourGYRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.banishedPile]: yourBanishedPileRef.current
                        ? getAbsoluteRect(yourBanishedPileRef.current.getBoundingClientRect())
                        : undefined,
                },
                [FieldKey.opponent]: {
                    [FieldComponentKey.deck]: oppDeckRef.current
                        ? getAbsoluteRect(oppDeckRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.extraDeck]: oppExtraDeckRef.current
                        ? getAbsoluteRect(oppExtraDeckRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.trunk]: oppTrunkRef.current
                        ? getAbsoluteRect(oppTrunkRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.gy]: oppGYRef.current
                        ? getAbsoluteRect(oppGYRef.current.getBoundingClientRect())
                        : undefined,
                    [FieldComponentKey.banishedPile]: oppBanishedPileRef.current
                        ? getAbsoluteRect(oppBanishedPileRef.current.getBoundingClientRect())
                        : undefined,
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    });

    const oppTrunkBoardComponent = getBoardComponent('opponent', 'trunk');
    const oppExtraDeckBoardComponent = getBoardComponent('opponent', 'extraDeck');
    const oppBanishedPileBoardComponent = getBoardComponent('opponent', 'banishedPile');
    const oppGYBoardComponent = getBoardComponent('opponent', 'gy');
    const oppDeckBoardComponent = getBoardComponent('opponent', 'deck');

    const yourTrunkBoardComponent = getBoardComponent('your', 'trunk');
    const yourExtraDeckBoardComponent = getBoardComponent('your', 'extraDeck');
    const yourBanishedPileBoardComponent = getBoardComponent('your', 'banishedPile');
    const yourGYBoardComponent = getBoardComponent('your', 'gy');
    const yourDeckBoardComponent = getBoardComponent('your', 'deck');

    return <BoardContainer ref={boardRef}
        className="play-board-drawing"
        style={{
            backgroundImage: `url("${process.env.PUBLIC_URL}/asset/img/texture/noise.png")`,
            cursor: `url('${process.env.PUBLIC_URL}/asset/img/counter/${activeCounter}-counter.png'), auto`,
        }}
    >
        <div className="side-col">
            <div className="side-col-component side-col-top">
                <div ref={oppDeckRef} className="vertical-zone">
                    {deckCountMap.get(oppDeckBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={oppDeckBoardComponent.preset} />
                        : null}
                </div>
                <div ref={oppGYRef} className="vertical-zone">
                    {deckCountMap.get(oppGYBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={oppGYBoardComponent.preset} />
                        : null}
                </div>
                <div ref={oppBanishedPileRef} className="vertical-zone pile">
                    {deckCountMap.get(oppBanishedPileBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={oppBanishedPileBoardComponent.preset} />
                        : null}
                </div>
            </div>
            <div className="padding" />
            <div className="side-col-component side-col-bot">
                <div ref={yourTrunkRef} className="vertical-zone trunk">
                    {deckCountMap.get(yourTrunkBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={yourTrunkBoardComponent.preset} />
                        : null}
                </div>
                <div className="vertical-zone with-icon">
                    <FieldIcon />
                </div>
                <div ref={yourExtraDeckRef} className="vertical-zone">
                    {deckCountMap.get(yourExtraDeckBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={yourExtraDeckBoardComponent.preset} />
                        : null}
                </div>
            </div>
        </div>
        <div className="main-col">
            <div className="main-col-component main-col-hand main-col-hand-top" />
            <div className="main-col-component main-col-field main-col-field-top">
                <div className="square-zone with-icon">
                    <PendulumIcon />
                </div>
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone with-icon">
                    <PendulumIcon />
                </div>
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
            </div>
            <div className="main-col-component main-col-center">
                <div className="empty-zone left-extra-section">
                    <TurnWidget />
                </div>
                <div className="square-zone" />
                <div className="empty-zone main-extra-section">
                    <LPWidget />
                    <RandomWidget />
                </div>
                <div className="square-zone" />
                <div className="empty-zone right-extra-section">
                    <CounterWidget />
                    <div ref={tokenPileRef} className="token with-icon" />
                </div>
            </div>
            <div className="main-col-component main-col-field main-col-field-bot">
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone with-icon">
                    <PendulumIcon />
                </div>
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone with-icon">
                    <PendulumIcon />
                </div>
            </div>
            <div className="main-col-component main-col-hand main-col-hand-bot" />
        </div>
        <div className="side-col">
            <div className="side-col-component side-col-top">
                <div ref={oppExtraDeckRef} className="vertical-zone">
                    {deckCountMap.get(oppExtraDeckBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={oppExtraDeckBoardComponent.preset} />
                        : null}
                </div>
                <div className="vertical-zone with-icon">
                    <FieldIcon />
                </div>
                <div ref={oppTrunkRef} className="vertical-zone trunk">
                    {deckCountMap.get(oppTrunkBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={oppTrunkBoardComponent.preset} />
                        : null}
                </div>
            </div>
            <div className="padding" />
            <div className="side-col-component side-col-bot">
                <div ref={yourBanishedPileRef} className="vertical-zone pile">
                    {deckCountMap.get(yourBanishedPileBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={yourBanishedPileBoardComponent.preset} />
                        : null}
                </div>
                <div ref={yourGYRef} className="vertical-zone">
                    {deckCountMap.get(yourGYBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={yourGYBoardComponent.preset} />
                        : null}
                </div>
                <div ref={yourDeckRef} className="vertical-zone">
                    {deckCountMap.get(yourDeckBoardComponent.name, DeckListConverter()).get('cardList').size > 1
                        ? <CardBack preset={yourDeckBoardComponent.preset} />
                        : null}
                </div>
            </div>
        </div>
    </BoardContainer>;
};