import styled from 'styled-components';
import { BoardDrawing } from './board-drawing';
import { BeaconAction, BoardMapping, CLASS_BOARD, CLASS_BOARD_ACTIVE, DOM_ENTITY_CLASS, DOMEntityType, DOMEntityTypeClass, FieldComponentKey, FieldDeckCoordinateMap, FieldKey, PropDOMEntityName, PropDOMEntityType, BOARD_INDEX, BoardComponentList } from 'src/model';
import { mergeClass } from 'src/util';
import { DeckButton } from '../deck';
import './play-board.scss';
import { useEffect, useRef, useState } from 'react';
import { useDOMEntityStateStore } from 'src/state';

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
    const addDOMEntity = useDOMEntityStateStore(state => state.addDOMEntity);

    useEffect(() => {
        if (boardDrawingRef.current) addDOMEntity(boardDrawingRef.current, DOMEntityType['board']);
    }, []);

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
        {BoardComponentList.map(boardComponent => {
            const { top: absoluteTop = 0, left: absoluteLeft = 0 } = boardDrawingRef.current?.getBoundingClientRect() ?? {};
            const { fieldComponentKey, fieldKey, ...deckButtonProps } = boardComponent;
            const { top, left } = coordinateMap[fieldKey]?.[fieldComponentKey] ?? {};

            if (top == null || left == null) return null;
            return <DeckButton key={`${fieldKey}${fieldComponentKey}`}
                {...deckButtonProps}
                absoluteTop={absoluteTop}
                absoluteLeft={absoluteLeft}
                offsetTop={top}
                offsetLeft={left}
            />;
        })}
    </BoardContainer>;
};

export { CardBoard } from './board-card';