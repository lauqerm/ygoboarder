import { useEffect, useRef } from 'react';
import { FieldComponentKeyMap, FieldDeckCoordinateMap, FieldKey, FieldKeyMap } from 'src/model';
import styled from 'styled-components';

const BoardContainer = styled.div`
    --field-card-height-sm: calc(var(--card-height-sm) + 2px);
    --field-card-width-sm: calc(var(--card-width-sm) + 2px);

    display: inline-grid;
    grid-template-columns: max-content max-content max-content;
    column-gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    .side-col {
        display: inline-grid;
        grid-template-columns: 1fr;
        grid-template-rows: min-content 1fr min-content;
        .side-col-component {
            display: inline-grid;
            grid-template-columns: 1fr;
            row-gap: var(--spacing-lg);
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

    useEffect(() => {
        onMount({
            [FieldKeyMap.your]: {
                [FieldComponentKeyMap.deck]: yourDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.extraDeck]: yourExtraDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.trunk]: yourTrunkRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.gy]: yourGYRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.banishedPile]: yourBanishedPileRef.current?.getBoundingClientRect(),
            },
            [FieldKeyMap.opponent]: {
                [FieldComponentKeyMap.deck]: oppDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.extraDeck]: oppExtraDeckRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.trunk]: oppTrunkRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.gy]: oppGYRef.current?.getBoundingClientRect(),
                [FieldComponentKeyMap.banishedPile]: oppBanishedPileRef.current?.getBoundingClientRect(),
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <BoardContainer>
        <div className="side-col">
            <div className="side-col-component side-col-top">
                <div ref={oppDeckRef} className="vertical-zone" />
                <div ref={oppGYRef} className="vertical-zone" />
                <div ref={oppBanishedPileRef} className="vertical-zone" />
            </div>
            <div className="padding" />
            <div className="side-col-component side-col-bot">
                <div ref={yourTrunkRef} className="vertical-zone" />
                <div className="vertical-zone" />
                <div ref={yourExtraDeckRef} className="vertical-zone" />
            </div>
        </div>
        <div className="main-col">
            <div className="main-col-component main-col-hand main-col-hand-top" />
            <div className="main-col-component main-col-field main-col-field-top">
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
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
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
                <div className="square-zone" />
            </div>
            <div className="main-col-component main-col-hand main-col-hand-bot" />
        </div>
        <div className="side-col">
            <div className="side-col-component side-col-top">
                <div ref={oppExtraDeckRef} className="vertical-zone" />
                <div className="vertical-zone" />
                <div ref={oppTrunkRef} className="vertical-zone" />
            </div>
            <div className="padding" />
            <div className="side-col-component side-col-bot">
                <div ref={yourBanishedPileRef} className="vertical-zone" />
                <div ref={yourGYRef} className="vertical-zone" />
                <div ref={yourDeckRef} className="vertical-zone" />
            </div>
        </div>
    </BoardContainer>;
};