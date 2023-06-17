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
    PROP_BOARD_NAME,
} from 'src/model';
import { mergeClass } from 'src/util';
import { DeckButton } from '../deck';
import { useEffect, useRef, useState } from 'react';
import { useDOMEntityState } from 'src/state';
import './play-board.scss';
import { DeckImporterDrawer, DeckImporterDrawerRef } from '../deck/deck-import';

const BoardContainer = styled.div`
    background-color: var(--main-primaryLighter);
    border: var(--bd);
    position: relative;
    display: inline-block;
`;

export type Board = {
    boardName: string,
}
export const Board = ({
    boardName,
}: Board) => {
    const importerRef = useRef<DeckImporterDrawerRef>(null);
    const [addingDeckId, setAddingDeckId] = useState<string | undefined>();
    const [coordinateMap, setCoordinateMap] = useState<Record<FieldKey, FieldDeckCoordinateMap | undefined>>({
        [FieldKey.your]: {},
        [FieldKey.opponent]: {},
    });

    /** [Register DOM Entity] */
    const boardDrawingRef = useRef<HTMLDivElement>(null);
    const addDOMEntity = useDOMEntityState(state => state.addDOMEntity);
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
        style={{ zIndex: BOARD_INDEX }}
        className={mergeClass(
            'play-board',
            CLASS_BOARD,
            DOM_ENTITY_CLASS, DOMEntityTypeClass['board'],
        )}
        {...{
            [PROP_BOARD_NAME]: boardName,
            [PROP_DOM_ENTITY_NAME]: boardName,
            [PROP_DOM_ENTITY_TYPE]: DOMEntityType['board'],
        }}
    >
        <BoardDrawing onCoordinateChnage={setCoordinateMap} />
        {BoardComponentList.map(boardComponent => {
            const { fieldComponentKey, fieldKey, ...deckButtonProps } = boardComponent;
            const { top, left } = coordinateMap[fieldKey]?.[fieldComponentKey] ?? {};
            const { name } = deckButtonProps;

            if (top == null || left == null) return null;
            return <DeckButton key={`${fieldKey}${fieldComponentKey}${top}${left}`}
                {...deckButtonProps}
                {...boardComponent}
                owner={boardName}
                /** Dịch 1px cho border */
                offsetTop={top + 1}
                offsetLeft={left + 1}
                onOpenImporter={(deckId, preset) => importerRef.current?.open(deckId, preset)}
                onClose={() => importerRef.current?.close()}
                isAdding={addingDeckId === name}
            />;
        })}
        <DeckImporterDrawer ref={importerRef} onVisibleChange={(isOpen, deckId) => {
            if (isOpen && deckId) setAddingDeckId(deckId);
            else setAddingDeckId(undefined);
        }} />
    </BoardContainer>;
};

export { CardBoard } from './board-card';