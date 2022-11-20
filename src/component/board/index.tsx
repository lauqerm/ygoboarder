import debounce from 'lodash.debounce';
import React, { useEffect, useRef, useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { CLASS_BOARD, DROP_TYPE_BOARD } from 'src/model';
import { BoardCard, BoardEntryConverter, useBoardStore } from 'src/state';
import { MovableCard } from '../card';
import { v4 as uuidv4 } from 'uuid';
import './play-board.scss';
import { List } from 'immutable';
import { mergeClass } from 'src/util';

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
    console.log('🚀 ~ file: index.tsx ~ line 22 ~ currentBoardList', currentBoardList);

    return <div
        data-board-name={boardName}
        style={{ zIndex: 1 }}
        className={mergeClass('play-board', CLASS_BOARD)}
    >
        Board
        {currentBoardList.map((boardCard, index) => {
            const cardId = `[BOARD-${boardName}]-[ID-${boardCard.get('card').get('_id')}]`;

            return <MovableCard key={boardCard.get('card').get('_id')}
                uniqueId={cardId}
                image={boardCard.get('card')}
                origin={boardCard.get('origin')}
                initialX={boardCard.get('initialX')}
                initialY={boardCard.get('initialY')}
            />;
        })}
    </div>;
};