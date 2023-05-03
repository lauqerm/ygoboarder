import styled from 'styled-components';
import { BoardDrawing } from './board-drawing';
import {
    CLASS_BOARD,
    CLASS_BOARD_ACTIVE,
    DOM_ENTITY_CLASS,
    DOMEntityType,
    DOMEntityTypeClass,
    FieldDeckCoordinateMap,
    FieldKey,
    PROP_DOM_ENTITY_NAME,
    PROP_DOM_ENTITY_TYPE,
    BOARD_INDEX,
    BoardComponentList,
} from 'src/model';
import { mergeClass } from 'src/util';
import { DeckButton } from '../deck';
import { useEffect, useRef, useState } from 'react';
import { useDOMEntityStateStore } from 'src/state';
import './play-board.scss';

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

    /** [Register DOM Entity] */
    const boardDrawingRef = useRef<HTMLDivElement>(null);
    const addDOMEntity = useDOMEntityStateStore(state => state.addDOMEntity);
    useEffect(() => {
        if (boardDrawingRef.current) addDOMEntity(boardDrawingRef.current, DOMEntityType['board']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            [PROP_DOM_ENTITY_NAME]: boardName,
            [PROP_DOM_ENTITY_TYPE]: DOMEntityType['board'],
        }}
    >
        <BoardDrawing onMount={setCoordinateMap} />
        {BoardComponentList.map(boardComponent => {
            const { fieldComponentKey, fieldKey, ...deckButtonProps } = boardComponent;
            const { top, left } = coordinateMap[fieldKey]?.[fieldComponentKey] ?? {};

            if (top == null || left == null) return null;
            return <DeckButton key={`${fieldKey}${fieldComponentKey}`}
                {...deckButtonProps}
                component={fieldComponentKey}
                /** Dịch 1px cho border */
                offsetTop={top + window.scrollY + 1}
                offsetLeft={left + window.scrollX + 1}
            />;
        })}
    </BoardContainer>;
};

export { CardBoard } from './board-card';