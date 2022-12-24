import styled from 'styled-components';
import { BoardCard, BoardEntryConverter, useBoardStore, useCardEventStore } from 'src/state';
import { List } from 'immutable';
import { MovableCard } from '../card';
import './play-board.scss';

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
            const cardId = `[BOARD-${boardName}]-[ID-${boardCard.get('card').get('_id')}]`;

            return <MovableCard key={boardCard.get('card').get('_id')}
                uniqueId={cardId}
                image={boardCard.get('card')}
                origin={boardCard.get('origin')}
                initialX={boardCard.get('initialX')}
                initialY={boardCard.get('initialY')}
            />;
        })}
    </BoardCardContainer>;
};