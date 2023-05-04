import { useEffect, useRef } from 'react';
import { FieldComponentKey, FieldDeckCoordinateMap, FieldKey, getBoardComponent } from 'src/model';
import styled from 'styled-components';
import { CardBack, FieldIcon, PendulumIcon } from '../atom';
import { useCountStore } from 'src/state';

const BoardContainer = styled.div`
    --field-card-height-sm: calc(var(--card-height-sm) + 2px);
    --field-card-width-sm: calc(var(--card-width-sm) + 2px);

    display: inline-grid;
    grid-template-columns: max-content max-content max-content;
    column-gap: var(--spacing-xl);
    padding: var(--spacing-xl);
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
            border-left-color: var(--main-primaryLighter);
            border-right-color: var(--main-primaryLighter);
        }
    }
    .square-zone {
        width: var(--field-card-height-sm);
        height: var(--field-card-height-sm);
        background-color: var(--main-secondaryLighter);
    }
    .vertical-zone {
        width: var(--field-card-width-sm);
        height: var(--field-card-height-sm);
        background-color: var(--main-secondaryLighter);
        border: var(--bd-contrast);
        &.hidden-zone {
            visibility: hidden;
        }
    }
    .empty-zone {
        width: var(--field-card-height-sm);
        background-color: var(--main-primaryLighter);
    }
    .with-icon {
        display: flex;
        svg {
            width: 60%;
            color: #fafafa;
            margin: auto;
        }
    }
`;

export type BoardDrawing = {
    onMount: (boardCoordinateMap: Record<FieldKey, FieldDeckCoordinateMap | undefined>) => void,
}
export const BoardDrawing = ({
    onMount,
}: BoardDrawing) => {
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

    const deckCountMap = useCountStore(state => state.countMap);

    useEffect(() => {
        onMount({
            [FieldKey.your]: {
                [FieldComponentKey.deck]: yourDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKey.extraDeck]: yourExtraDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKey.trunk]: yourTrunkRef.current?.getBoundingClientRect(),
                [FieldComponentKey.gy]: yourGYRef.current?.getBoundingClientRect(),
                [FieldComponentKey.banishedPile]: yourBanishedPileRef.current?.getBoundingClientRect(),
            },
            [FieldKey.opponent]: {
                [FieldComponentKey.deck]: oppDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKey.extraDeck]: oppExtraDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKey.trunk]: oppTrunkRef.current?.getBoundingClientRect(),
                [FieldComponentKey.gy]: oppGYRef.current?.getBoundingClientRect(),
                [FieldComponentKey.banishedPile]: oppBanishedPileRef.current?.getBoundingClientRect(),
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    return <BoardContainer>
        <div className="side-col">
            <div className="side-col-component side-col-top">
                <div ref={oppDeckRef} className="vertical-zone">
                    {(deckCountMap[oppDeckBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={oppDeckBoardComponent.preset} />
                        : null}
                </div>
                <div ref={oppGYRef} className="vertical-zone">
                    {(deckCountMap[oppGYBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={oppGYBoardComponent.preset} />
                        : null}
                </div>
                <div ref={oppBanishedPileRef} className="vertical-zone">
                    {(deckCountMap[oppBanishedPileBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={oppBanishedPileBoardComponent.preset} />
                        : null}
                </div>
            </div>
            <div className="padding" />
            <div className="side-col-component side-col-bot">
                <div ref={yourTrunkRef} className="vertical-zone">
                    {(deckCountMap[yourTrunkBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={yourTrunkBoardComponent.preset} />
                        : null}
                </div>
                <div className="vertical-zone with-icon">
                    <FieldIcon />
                </div>
                <div ref={yourExtraDeckRef} className="vertical-zone">
                    {(deckCountMap[yourExtraDeckBoardComponent.name] ?? 0) > 1
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
                <div className="empty-zone left-extra-section" />
                <div className="square-zone" />
                <div className="empty-zone main-extra-section" />
                <div className="square-zone" />
                <div className="empty-zone right-extra-section" />
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
                    {(deckCountMap[oppExtraDeckBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={oppExtraDeckBoardComponent.preset} />
                        : null}
                </div>
                <div className="vertical-zone with-icon">
                    <FieldIcon />
                </div>
                <div ref={oppTrunkRef} className="vertical-zone">
                    {(deckCountMap[oppTrunkBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={oppTrunkBoardComponent.preset} />
                        : null}
                </div>
            </div>
            <div className="padding" />
            <div className="side-col-component side-col-bot">
                <div ref={yourBanishedPileRef} className="vertical-zone">
                    {(deckCountMap[yourBanishedPileBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={yourBanishedPileBoardComponent.preset} />
                        : null}
                </div>
                <div ref={yourGYRef} className="vertical-zone">
                    {(deckCountMap[yourGYBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={yourGYBoardComponent.preset} />
                        : null}
                </div>
                <div ref={yourDeckRef} className="vertical-zone">
                    {(deckCountMap[yourDeckBoardComponent.name] ?? 0) > 1
                        ? <CardBack preset={yourDeckBoardComponent.preset} />
                        : null}
                </div>
            </div>
        </div>
    </BoardContainer>;
};