import { List, Record as ImmutableRecord, Map } from 'immutable';
import { CardImage, CardImageConverter, DeckType } from 'src/model';
import create from 'zustand';
import { BaseDeckCard } from './deck-store';

type BaseBoardCard = BaseDeckCard & {
    initialX: number,
    initialY: number,
};
export type BoardCard = ImmutableRecord<BaseBoardCard>;
export const BoardCardConverter = ImmutableRecord<BaseBoardCard>({
    card: CardImageConverter(),
    origin: '',
    initialX: 0,
    initialY: 0,
});

export type BoardList = List<BoardCard>;
export type BoardState = {
    boardList: Map<string, BoardList>,
    add: (boardId: string, cardList: { card: CardImage, initialX: number, initialY: number, origin: string }[]) => void,
    delete: (boardId: string, idList: string[]) => void,
    reset: () => void,
}
export const useBoardStore = create<BoardState>((set) => ({
    boardList: Map(),
    add: (boardId, cardList) => set(state => {
        console.log('ADD TO BOARD');
        let newList = state.boardList.get(boardId, List<BoardCard>());
        if (newList) cardList.forEach(card => {
            newList = newList.push(BoardCardConverter({ ...card }));
        });

        return {
            ...state,
            boardList: state.boardList.set(boardId, newList),
        };
    }),
    delete: (deckId, idList) => set(state => {
        let newList = state.boardList.get(deckId, List<BoardCard>());
        
        if (newList) {
            idList.forEach(id => { newList = newList.filter(value => value.get('card').get('_id') !== id) });
        }

        return {
            ...state,
            boardList: state.boardList.set(deckId, newList),
        };
    }),
    reset: () => set(state => {
        return { ...state, boardList: Map() };
    }),
}));