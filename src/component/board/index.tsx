import styled from 'styled-components';
import { BoardDrawing } from './board-drawing';
import { BeaconAction, CLASS_BOARD, CLASS_BOARD_ACTIVE, FieldComponentKey, FieldComponentKeyMap, FieldDeckCoordinateMap, FieldKey, FieldKeyMap } from 'src/model';
import { mergeClass } from 'src/util';
import { DeckButton } from '../deck';
import './play-board.scss';
import { useRef, useState } from 'react';

const BoardContainer = styled.div`
    background-color: var(--main-primaryLighter);
    border: var(--bd);
    position: relative;
    display: inline-block;
    flex: 0;
`;
const BoardMapping: {
    fieldList: FieldKey[],
} & Record<FieldKey, {
    key: FieldKey,
    componentList: FieldComponentKey[],
    componentMap: Record<FieldComponentKey, DeckButton & {
        deckType: FieldComponentKey,
    }>
}> = {
    fieldList: [FieldKeyMap.your, FieldKeyMap.opponent],
    [FieldKeyMap.your]: {
        key: FieldKeyMap.your,
        componentList: [
            FieldComponentKeyMap.deck,
            FieldComponentKeyMap.extraDeck,
            FieldComponentKeyMap.gy,
            FieldComponentKeyMap.banishedPile,
            FieldComponentKeyMap.trunk,
        ],
        componentMap: {
            [FieldComponentKeyMap.deck]: {
                deckType: FieldComponentKeyMap.deck,
                type: 'permanent',
                displayName: 'Your Deck',
                name: 'YOUR-DECK',
            },
            [FieldComponentKeyMap.extraDeck]: {
                deckType: FieldComponentKeyMap.extraDeck,
                type: 'permanent',
                displayName: 'Your Extra Deck',
                name: 'YOUR-EXTRA-DECK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle']],
            },
            [FieldComponentKeyMap.trunk]: {
                deckType: FieldComponentKeyMap.trunk,
                type: 'consistent',
                displayName: 'Your Trunk',
                name: 'YOUR-TRUNK',
            },
            [FieldComponentKeyMap.gy]: {
                deckType: FieldComponentKeyMap.gy,
                type: 'transient',
                displayName: 'Your GY',
                name: 'YOUR-GY',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
            [FieldComponentKeyMap.banishedPile]: {
                deckType: FieldComponentKeyMap.banishedPile,
                type: 'transient',
                displayName: 'Your Banished Pile',
                name: 'YOUR-BANISHED-PILE',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
        },
    },
    [FieldKeyMap.opponent]: {
        key: FieldKeyMap.opponent,
        componentList: [
            FieldComponentKeyMap.deck,
            FieldComponentKeyMap.extraDeck,
            FieldComponentKeyMap.gy,
            FieldComponentKeyMap.banishedPile,
            FieldComponentKeyMap.trunk,
        ],
        componentMap: {
            [FieldComponentKeyMap.deck]: {
                deckType: FieldComponentKeyMap.deck,
                preset: 'opp',
                type: 'permanent',
                displayName: 'Opponent\'s Deck',
                name: 'OP-DECK',
            },
            [FieldComponentKeyMap.extraDeck]: {
                deckType: FieldComponentKeyMap.extraDeck,
                preset: 'opp',
                type: 'permanent',
                displayName: 'Opponent\'s Extra Deck',
                name: 'OP-EXTRA-DECK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle']],
            },
            [FieldComponentKeyMap.trunk]: {
                deckType: FieldComponentKeyMap.trunk,
                preset: 'opp',
                type: 'consistent',
                displayName: 'Opponent\'s Trunk',
                name: 'OP-TRUNK',
            },
            [FieldComponentKeyMap.gy]: {
                deckType: FieldComponentKeyMap.gy,
                preset: 'opp',
                type: 'transient',
                displayName: 'Opponent\'s GY',
                name: 'OP-GY',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
            [FieldComponentKeyMap.banishedPile]: {
                deckType: FieldComponentKeyMap.banishedPile,
                preset: 'opp',
                type: 'transient',
                displayName: 'Opponent\'s Banished Pile',
                name: 'OP-BANISHED-PILE',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
        },
    },
};

export type Board = {
    boardName: string,
}
export const Board = ({
    boardName,
}: Board) => {
    const [coordinateMap, setCoordinateMap] = useState<Record<FieldKey, FieldDeckCoordinateMap | undefined>>({
        [FieldKeyMap.your]: {},
        [FieldKeyMap.opponent]: {},
    });
    const boardDrawingRef = useRef<HTMLDivElement>(null);

    return <BoardContainer ref={boardDrawingRef}
        onMouseOver={() => {
            if (!boardDrawingRef.current?.classList.contains(CLASS_BOARD_ACTIVE)) {
                boardDrawingRef.current?.classList.add(CLASS_BOARD_ACTIVE);
            }
        }}
        onMouseOut={e => {
            boardDrawingRef.current?.classList.remove(CLASS_BOARD_ACTIVE);
        }}
        data-board-name={boardName}
        style={{ zIndex: 1 }}
        className={mergeClass('play-board', CLASS_BOARD)}
    >
        <BoardDrawing onMount={setCoordinateMap} />
        {BoardMapping.fieldList.map(fieldKey => {
            const { top: absoluteTop = 0, left: absoluteLeft = 0 } = boardDrawingRef.current?.getBoundingClientRect() ?? {};
            console.log('🚀 ~ file: index.tsx:151 ~ absoluteLeft', absoluteLeft);
            return BoardMapping[fieldKey].componentList.map(fieldComponentKey => {
                const { deckType, ...deckButtonProps } = BoardMapping[fieldKey].componentMap[fieldComponentKey];
                const { top = 0, left = 0 } = coordinateMap[fieldKey]?.[fieldComponentKey] ?? {};

                return <DeckButton key={fieldComponentKey}
                    top={top - absoluteTop}
                    left={left - absoluteLeft}
                    {...deckButtonProps}
                />;
            });
        })}
    </BoardContainer>;
};

export { CardBoard } from './board-card';