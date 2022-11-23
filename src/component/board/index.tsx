import styled from 'styled-components';
import { BoardCard, BoardEntryConverter, useBoardStore } from 'src/state';
import { BoardDrawing } from './board-drawing';
import { CLASS_BOARD } from 'src/model';
import { List } from 'immutable';
import { MovableCard } from '../card';
import { mergeClass } from 'src/util';
import './play-board.scss';

const BoardContainer = styled.div`
    background-color: var(--main-primaryLighter);
    border: var(--bd);
`;

export type Board = {
    boardName: string,
}
export const Board = ({
    boardName,
}: Board) => {
    const currentBoardList = useBoardStore(
        state => state.boardMap.get(boardName, BoardEntryConverter()).get('boardCardList', List<BoardCard>()),
        (oldState, newState) => oldState.equals(newState),
    );

    return <BoardContainer
        data-board-name={boardName}
        style={{ zIndex: 1 }}
        className={mergeClass('play-board', CLASS_BOARD)}
    >
        <BoardDrawing />
        {currentBoardList.map(boardCard => {
            const cardId = `[BOARD-${boardName}]-[ID-${boardCard.get('card').get('_id')}]`;

            return <MovableCard key={boardCard.get('card').get('_id')}
                uniqueId={cardId}
                image={boardCard.get('card')}
                origin={boardCard.get('origin')}
                initialX={boardCard.get('initialX')}
                initialY={boardCard.get('initialY')}
            />;
        })}
    </BoardContainer>;
};