import styled from 'styled-components';
import { BoardCard, BoardEntryConverter, useBoardStore, useCardGroupStore } from 'src/state';
import { List } from 'immutable';
import { MovableCard, MovableCardGroup } from '../card';
import './play-board.scss';
import { CLASS_BOARD, CLASS_CARD_MOVABLE, CLASS_CARD_MOVABLE_ZONED, DOMEntityType } from 'src/model';
import Selecto from 'react-selecto';
import { useState } from 'react';

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
    const [cardGroupKey, setCardGroupKey] = useState(0);
    const [cardGroupCount, setCardGroupCount] = useState(0);
    const addToCardGroup = useCardGroupStore(state => state.addToGroup);
    const currentBoardList = useBoardStore(
        state => state.boardMap.get(boardName, BoardEntryConverter()).get('boardCardList', List<BoardCard>()),
        (oldState, newState) => oldState.equals(newState),
    );

    return <BoardCardContainer
        data-card-board-name={boardName}
        className="play-card-board"
    >
        <button onClick={() => {
            addToCardGroup('board-group', Array.from(document.querySelectorAll(`.${CLASS_CARD_MOVABLE}`).values()) as HTMLElement[]);
        }}>Get group</button>
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
        <MovableCardGroup key={cardGroupKey} groupName="board-group" count={cardGroupCount} />
        <Selecto
            // The container to add a selection element
            container={document.getElementById('modal-wrapper')}
            // The area to drag selection element (default: container)
            dragContainer={window}
            // Targets to select. You can register a queryselector or an Element.
            selectableTargets={[`.${CLASS_CARD_MOVABLE}[data-moveable-card-origin-entity="${DOMEntityType['board']}"]`]}
            // Whether to select from the target inside (default: true)
            selectFromInside={true}
            // After the select, whether to select the next target with the selected target (deselected if the target is selected again).
            continueSelect={false}
            // Determines which key to continue selecting the next target via keydown and keyup.
            toggleContinueSelect={'shift'}
            // The container for keydown and keyup events
            keyContainer={window}
            // The rate at which the target overlaps the drag area to be selected. (default: 100)
            hitRate={100}
            onSelect={e => {
                e.added.forEach(el => {
                    el.classList.add(CLASS_CARD_MOVABLE_ZONED, 'card-is-zoned');
                });
                e.removed.forEach(el => {
                    el.classList.remove(CLASS_CARD_MOVABLE_ZONED, 'card-is-zoned');
                });
                setCardGroupCount(e.selected.length);
            }}
            onDragStart={e => {
                if (!e.inputEvent.target?.closest(`.${CLASS_BOARD}`)) {
                    e.stop();
                };
            }}
            onDragEnd={() => {
                setCardGroupKey(cur => cur + 1);
            }}
        />
    </BoardCardContainer>;
};