import styled from 'styled-components';
import { BoardDrawing } from './board-drawing';
import { BeaconAction, BoardMapping, CLASS_BOARD, CLASS_BOARD_ACTIVE, DOM_ENTITY_CLASS, DOMEntityType, DOMEntityTypeClass, FieldComponentKey, FieldDeckCoordinateMap, FieldKey, PropDOMEntityName, PropDOMEntityType, BOARD_INDEX } from 'src/model';
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


export type Board = {
    boardName: string,
}
export const Board = ({
    boardName,
}: Board) => {
    const [coordinateMap, setCoordinateMap] = useState<Record<FieldKey, FieldDeckCoordinateMap | undefined>>({
        [FieldKey.your]: {},
        [FieldKey.opponent]: {},
    });
    const boardDrawingRef = useRef<HTMLDivElement>(null);

    return <BoardContainer ref={boardDrawingRef}
        onMouseOver={() => {
            console.log('🚀 ~ file: index.tsx:137 ~ onMouseOver');
            if (!boardDrawingRef.current?.classList.contains(CLASS_BOARD_ACTIVE)) {
                boardDrawingRef.current?.classList.add(CLASS_BOARD_ACTIVE);
            }
        }}
        onMouseOut={e => {
            boardDrawingRef.current?.classList.remove(CLASS_BOARD_ACTIVE);
        }}
        data-board-name={boardName}
        style={{ zIndex: BOARD_INDEX }}
        className={mergeClass(
            'play-board',
            CLASS_BOARD,
            DOM_ENTITY_CLASS, DOMEntityTypeClass['board'],
        )}
        {...{
            [PropDOMEntityName]: boardName,
            [PropDOMEntityType]: DOMEntityType['board'],
        }}
    >
        <BoardDrawing onMount={setCoordinateMap} />
        {BoardMapping.fieldList.map(fieldKey => {
            const { top: absoluteTop = 0, left: absoluteLeft = 0 } = boardDrawingRef.current?.getBoundingClientRect() ?? {};
            return BoardMapping[fieldKey].componentList.map(fieldComponentKey => {
                const { deckType, ...deckButtonProps } = BoardMapping[fieldKey].componentMap[fieldComponentKey];
                const { top, left } = coordinateMap[fieldKey]?.[fieldComponentKey] ?? {};

                if (top == null || left == null) return null;
                return <DeckButton key={fieldComponentKey}
                    {...deckButtonProps}
                    absoluteTop={absoluteTop}
                    absoluteLeft={absoluteLeft}
                    offsetTop={top}
                    offsetLeft={left}
                />;
            });
        })}
    </BoardContainer>;
};

export { CardBoard } from './board-card';