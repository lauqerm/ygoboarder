import { CardSize, DECK_COL_COUNT, DECK_ROW_COUNT } from 'src/model';
import styled from 'styled-components';

const DRAGGABLE_CARD_WIDTH = CardSize.sm.width + 2 * 2 + 1 * 2;
/** Total card length + 2 border + 2 padding + possible scrollbar */
export const DECK_MODAL_WIDTH = DRAGGABLE_CARD_WIDTH * DECK_COL_COUNT + 1 * 2 + 8 * 2 + 10;
export const DECK_MODAL_HEIGHT = 600;

export const DeckModalHandleContainer = styled.div`
    position: absolute;
    width: ${DECK_MODAL_WIDTH}px;
    background-color: var(--dim);
    border: var(--bd);
    border-radius: var(--br) var(--br) 0 0;
    padding: var(--spacing);
    line-height: 1;
    font-size: var(--fs-lg);
    font-weight: bold;
    .deck-modal-content {
        display: flex;
        justify-content: space-between;
    }
    .deck-modal-title-content {
        display: flex;
        align-items: center;
        column-gap: var(--spacing-sm);
        .ant-tag {
            transition: all 0s;
        }
    }
    .moveable-control-box {
        visibility: hidden!important;
    }
    .deck-tool-bar {
        display: grid;
        grid-template-columns: max-content max-content max-content max-content;
        align-items: center;
        column-gap: var(--spacing);
        background: var(--dim);
        margin: var(--spacing-neg-md) var(--spacing-neg-md) var(--spacing-neg-md) 0;
        .anticon.anticon-close {
            height: 100%;
            padding: var(--spacing) var(--spacing-xl);
            display: flex;
            align-items: center;
            cursor: pointer;
            border-radius: 0 var(--br-sm) 0 0;
            &:hover {
                color: var(--contrast-danger);
                background-color: var(--sub-danger);
            }
        }
    }
    &:hover {
        cursor: grab;
    }
`;

export const ModalContainer = styled.div<{ $beaconCount: number }>`
    // 4px margin + 2px gap
    --row-height: calc(var(--card-height-sm) + 4px + 2px);
    --content-height: ${() => `calc(var(--row-height) * ${DECK_ROW_COUNT});`};
    width: ${DECK_MODAL_WIDTH}px;
    border: var(--bd);
    border-radius: var(--br);
    overflow: hidden;
    position: absolute;
    box-shadow: var(--bs-large);
    .deck-modal-header-padding {
        height: 39px;
        pointer-events: none;
    }
    .deck-beacon-wrapper {
        display: grid;
        grid-template-columns: 0 1fr;
        background: var(--main-secondaryLighter);
    }
    .deck-result {
        /** Trừ scroll + 2 padding */
        width: calc(${DECK_MODAL_WIDTH}px - 10px - 2 * 8px);
        overflow: hidden;
    }
    .deck-card-list {
        height: var(--content-height);
        overflow-y: auto;
        overflow-x: hidden;
        padding: var(--spacing);
    }
    .deck-modal-beacon-list {
        position: relative;
        z-index: 1;
        grid-row: 1 / span 2;
        .deck-beacon {
            position: absolute;
            height: ${props => `calc(var(--content-height) / ${props.$beaconCount})`};
            width: ${DECK_MODAL_WIDTH}px;
            font-size: calc(var(--content-height) / 9);
            left: -1px;
            &:nth-child(1) {
                top: ${props => `calc(var(--content-height) * 0 / ${props.$beaconCount})`};
            }
            &:nth-child(2) {
                top: ${props => `calc(var(--content-height) * 1 / ${props.$beaconCount})`};
            }
            &:nth-child(3) {
                top: ${props => `calc(var(--content-height) * 2 / ${props.$beaconCount})`};
            }
        }
    }
    .ygo-draggable-card {
        border-left: 2px solid transparent;
        border-right: 2px solid transparent;
        padding: var(--spacing-xxs) 0;
        margin: var(--spacing-xxs);
        &.affected-by-dragging {
            border-left: 2px solid limegreen;
            + .affected-by-dragging {
                border-left-color: transparent;
            }
        }
        &.is-dragging + * {
            border-left-color: greenyellow;
        }
    }
`;

export const ModalRowContainer = styled.div<{ lastRowExtender: number }>`
    height: ${props => `calc(var(--row-height) * ${props.lastRowExtender});`}
`;