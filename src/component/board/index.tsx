import debounce from 'lodash.debounce';
import React, { useEffect, useRef, useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { DROP_TYPE_BOARD } from 'src/model';
import { BoardCard, useBoardStore } from 'src/state';
import { MovableCard } from '../card';
import { v4 as uuidv4 } from 'uuid';
import './play-board.scss';
import { List } from 'immutable';

export type Board = {
}
export const Board = ({
}: Board) => {
    const [boardId] = useState(uuidv4());
    const currentBoardList = useBoardStore(
        state => state.boardList.get(boardId) ?? List<BoardCard>(),
        (oldState, newState) => oldState.equals(newState),
    );

    return <Droppable droppableId={`[TYPE-${DROP_TYPE_BOARD}]-[ID-${boardId}]`}>
        {dropProvided => {
            return <div
                ref={dropProvided.innerRef}
                data-board-id={boardId}
                className="play-board"
                {...dropProvided.droppableProps}
            >
                Board
                {currentBoardList.map((boardCard, index) => {
                    const cardId = `[BOARD-${boardId}]-[ID-${boardCard.get('card').get('_id')}]`;

                    return <MovableCard key={boardCard.get('card').get('_id')}
                        uniqueId={cardId}
                        image={boardCard.get('card')}
                        origin={boardCard.get('origin')}
                        initialX={boardCard.get('initialX')}
                        initialY={boardCard.get('initialY')}
                    />;
                })}
                {dropProvided.placeholder}
            </div>;
        }}
    </Droppable>;
};