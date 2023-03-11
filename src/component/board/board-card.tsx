import styled from 'styled-components';
import { BoardCard, BoardEntryConverter, useBoardStore } from 'src/state';
import { List } from 'immutable';
import { MovableCard } from '../card';
import './play-board.scss';
import { DOMEntityType } from 'src/model';

const BoardCardContainer = styled.div`
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    position: fixed;
`;

export type CardBoard = {
    boardName: string,
}
export const CardBoard = ({
    boardName,
}: CardBoard) => {
    const currentBoardList = useBoardStore(
        state => state.boardMap.get(boardName, BoardEntryConverter()).get('boardCardList', List<BoardCard>()),
        (oldState, newState) => oldState.equals(newState),
    );

    return <BoardCardContainer
        data-card-board-name={boardName}
        className="play-card-board"
    >
        {currentBoardList.map(boardCard => {
            return <MovableCard key={boardCard.get('card').get('_id')}
                uniqueId={`[BOARD-${boardName}]-[ID-${boardCard.get('card').get('_id')}]`}
                image={boardCard.get('card')}
                origin={boardCard.get('origin')}
                initialX={boardCard.get('initialX')}
                initialY={boardCard.get('initialY')}
                originEntity={DOMEntityType['board']}
            />;
        })}
    </BoardCardContainer>;
};