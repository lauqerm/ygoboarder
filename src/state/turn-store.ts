import { CardPreset, TurnPhase } from 'src/model';
import create from 'zustand';

export type TurnState = {
    turn: number,
    currentPlayer: CardPreset,
    currentPhase: TurnPhase,
    changeTurn: (phase?: TurnPhase, player?: CardPreset, turn?: number) => void,
}
export const useTurnState = create<TurnState>(set => ({
    turn: 1,
    currentPlayer: 'your',
    currentPhase: 'draw',
    changeTurn: (phase, player, turn) => set(state => {
        const nextTurn = turn ?? state.turn;
        const nextPhase: TurnPhase = phase ?? 'draw';
        const nextPlayer = player ?? (state.currentPlayer === 'opp' ? 'your' : 'opp');

        return {
            ...state,
            turn: nextTurn,
            currentPhase: nextPhase,
            currentPlayer: nextPlayer,
        };
    }),
}));