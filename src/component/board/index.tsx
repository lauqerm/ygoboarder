import styled from 'styled-components';
import { BoardDrawing } from './board-drawing';
import { BeaconAction, CLASS_BOARD } from 'src/model';
import { mergeClass } from 'src/util';
import { DeckButton } from '../deck';
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
    return <BoardContainer
        data-board-name={boardName}
        style={{ zIndex: 1 }}
        className={mergeClass('play-board', CLASS_BOARD)}
    >
        <BoardDrawing
            yourDeckMap={{
                deck: <DeckButton
                    type="permanent"
                    displayName="Your Deck"
                    name="YOUR-DECK"
                />,
                extraDeck: <DeckButton
                    type="permanent"
                    displayName="Your Extra Deck"
                    name="YOUR-EXTRA-DECK"
                    beaconList={[BeaconAction['top'], BeaconAction['shuffle']]}
                />,
                trunk: <DeckButton
                    type="consistent"
                    displayName="Your Trunk"
                    name="YOUR-TRUNK"
                />,
                gy: <DeckButton
                    type="transient"
                    displayName="Your GY"
                    name="YOUR-GY"
                    beaconList={[BeaconAction['top'], BeaconAction['bottom']]}
                />,
                banishedPile: <DeckButton
                    type="transient"
                    displayName="Your Banished Pile"
                    name="YOUR-BANISHED-PILE"
                    beaconList={[BeaconAction['top'], BeaconAction['bottom']]}
                />,
            }}
            opponentDeckMap={{
                deck: <DeckButton
                    preset="opp"
                    type="permanent"
                    displayName="Opponent's Deck"
                    name="OP-DECK"
                />,
                extraDeck: <DeckButton
                    preset="opp"
                    type="permanent"
                    displayName="Opponent's Extra Deck"
                    name="OP-EXTRA-DECK"
                    beaconList={[BeaconAction['top'], BeaconAction['shuffle']]}
                />,
                trunk: <DeckButton
                    preset="opp"
                    type="consistent"
                    displayName="Opponent's Trunk"
                    name="OP-TRUNK"
                />,
                gy: <DeckButton
                    preset="opp"
                    type="transient"
                    displayName="Opponent's GY"
                    name="OP-GY"
                    beaconList={[BeaconAction['top'], BeaconAction['bottom']]}
                />,
                banishedPile: <DeckButton
                    preset="opp"
                    type="transient"
                    displayName="Opponent's Banished Pile"
                    name="OP-BANISHED-PILE"
                    beaconList={[BeaconAction['top'], BeaconAction['bottom']]}
                />,
            }}
        />
    </BoardContainer>;
};

export { CardBoard } from './board-card';