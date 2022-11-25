import React from 'react';
import styled from 'styled-components';
import { DeckButton } from '../deck';

const BoardContainer = styled.div`
    display: flex;
    flex-direction: column;
    .opponent-field {
        transform: rotate(180deg);
    }
`;
const FieldContainer = styled.div`
    --field-card-height-sm: calc(var(--card-height-sm) + 2px);
    --field-card-width-sm: calc(var(--card-width-sm) + 2px);
    display: grid;
    grid-template-columns: max-content min-content max-content;
    grid-template-rows: max-content max-content 1fr;
    .field-col {
        grid-row: span 3;
        padding: var(--spacing-lg);
    }
    .main-col {
        background-color: var(--main-contrast);
        border: var(--bd-contrast);
        column-gap: 1px;
        display: inline-flex;
        flex-wrap: wrap;
        row-gap: 1px;
        width: calc(var(--field-card-height-sm) * 5 + 1px * 4 + 1px * 2);
    }
    .half-col {
        background-color: var(--main-contrast);
        border-left: 1px solid var(--main-primaryLighter);
        border-right: 1px solid var(--main-primaryLighter);
        column-gap: 1px;
        display: inline-flex;
        flex-wrap: wrap;
        row-gap: 1px;
        width: calc(var(--field-card-height-sm) * 5 + 1px * 4 + 1px * 2);
    }
    .right-col {
        grid-row: span 3;
        padding: var(--spacing-lg);
    }
    .square-zone {
        width: var(--field-card-height-sm);
        height: var(--field-card-height-sm);
        background-color: var(--main-secondaryLighter);
    }
    .half-zone {
        width: var(--field-card-height-sm);
        height: calc(var(--field-card-height-sm) / 2);
        background-color: var(--main-secondaryLighter);
    }
    .empty-zone {
        width: var(--field-card-height-sm);
        background-color: var(--main-primaryLighter);
    }
    .vertical-zone {
        width: var(--field-card-width-sm);
        height: var(--field-card-height-sm);
        background-color: var(--main-secondaryLighter);
        border: var(--bd-contrast);
        + .vertical-zone {
            margin-top: var(--spacing-lg);
        }
        &.hidden-zone {
            visibility: hidden;
        }
    }
`;
const FieldDrawing = (props: React.HTMLAttributes<HTMLDivElement>) => {
    return <FieldContainer {...props}>
        <div className="field-col">
            <div className="vertical-zone hidden-zone"></div>
            <div className="vertical-zone"></div>
            <div className="vertical-zone"></div>
        </div>
        <div className="half-col">
            <div className="empty-zone left-extra-section"></div>
            <div className="half-zone"></div>
            <div className="empty-zone middle-extra-section"></div>
            <div className="half-zone"></div>
            <div className="empty-zone right-extra-section"></div>
        </div>
        <div className="right-col">
            <div className="vertical-zone"></div>
            <div className="vertical-zone"></div>
            <div className="vertical-zone"></div>
        </div>
        <div className="main-col">
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
            <div className="square-zone"></div>
        </div>
        <div className="hand-col"></div>
    </FieldContainer>;
};
export const BoardDrawing = () => {
    return <BoardContainer>
        <FieldDrawing className="opponent-field" />
        <FieldDrawing className="your-field" />
    </BoardContainer>;
};