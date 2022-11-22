import { DECK_ROW_COUNT } from 'src/model';
import styled from 'styled-components';

const DRAGGABLE_CARD_WIDTH = 112;
/** Total card length + 2 border + possible scrollbar */
export const DECK_MODAL_WIDTH = DRAGGABLE_CARD_WIDTH * DECK_ROW_COUNT + 1 * 2 + 10;
export const DECK_MODAL_HEIGHT = 520;

export const DeckModalHandleContainer = styled.div`
    position: absolute;
    width: ${DECK_MODAL_WIDTH}px;
    background-color: var(--main-colorLighter);
    border: var(--bd);
    border-bottom: 0;
    border-radius: var(--br) var(--br) 0 0;
    padding: var(--spacing);
    line-height: 1;
    font-size: var(--fs-lg);
    font-weight: bold;
    .deck-modal-content {
        display: flex;
        justify-content: space-between;
        .anticon.anticon-close {
            cursor: pointer;
            &:hover {
                color: var(--sub-danger);
            }
        }
    }
    .moveable-control-box {
        visibility: hidden!important;
    }
    &:hover {
        cursor: grab;
    }
`;

export const ModalContainer = styled.div`
    --row-height: 160px;
    --content-height: calc(var(--row-height) * 3 + var(--spacing) * 2);
    width: ${DECK_MODAL_WIDTH}px;
    display: grid;
    grid-template-columns: 0 1fr;
    background: var(--main-color);
    border: var(--bd);
    border-radius: 0 0 var(--br) var(--br);
    overflow: hidden;
    .deck-result {
        width: calc(${DECK_MODAL_WIDTH}px - 10px);
        overflow: hidden;
    }
    .deck-card-list {
        height: var(--content-height);
        overflow-y: auto;
        overflow-x: hidden;
    }
    .deck-tool-bar {
        display: grid;
        grid-template-columns: 1fr max-content max-content max-content;
        align-items: center;
        column-gap: var(--spacing);
        padding: var(--spacing);
        background: var(--main-colorLighter);
        border-top: var(--bd);
    }
    .deck-modal-beacon-list {
        position: relative;
        z-index: 1;
        grid-row: 1 / span 2;
        .deck-beacon {
            position: absolute;
            height: calc(var(--content-height) / 3);
            width: ${DECK_MODAL_WIDTH}px;
            font-size: calc(var(--content-height) / 9);
            left: -1px;
            &:nth-child(1) {
                top: calc(var(--content-height) * 0);
            }
            &:nth-child(2) {
                top: calc(var(--content-height) * 1 / 3);
            }
            &:nth-child(3) {
                top: calc(var(--content-height) * 2 / 3);
            }
        }
    }
    .affected-by-dragging {
        border-left: 2px solid limegreen;
        + .affected-by-dragging {
            border-left-color: transparent;
        }
    }
    .is-dragging + * {
        border-left-color: greenyellow;
    }
`;