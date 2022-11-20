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

export type BaseBoardEntry = {
    boardName: string,
    boardCardList: List<BoardCard>,
};
export type BoardEntry = ImmutableRecord<BaseBoardEntry>;
export const BoardEntryConverter = ImmutableRecord<BaseBoardEntry>({
    boardName: '',
    boardCardList: List(),
});
export type BoardState = {
    boardMap: Map<string, BoardEntry>,
    add: (boardName: string, cardList: { card: CardImage, initialX: number, initialY: number, origin: string }[]) => void,
    delete: (boardName: string, idList: string[]) => void,
    reset: () => void,
}
export const useBoardStore = create<BoardState>((set) => ({
    boardMap: Map(),
    add: (boardName, cardList) => set(state => {
        let newEntry = state.boardMap.get(boardName, BoardEntryConverter());
        let newList = newEntry.get('boardCardList', List<BoardCard>());
        if (newList) {
            cardList.forEach(card => {
                newList = newList.push(BoardCardConverter({ ...card }));
            });
        }
        newEntry = newEntry.set('boardCardList', newList);

        return {
            ...state,
            boardMap: state.boardMap.set(boardName, newEntry),
        };
    }),
    delete: (boardName, idList) => set(state => {
        let newEntry = state.boardMap.get(boardName, BoardEntryConverter());
        let newList = newEntry.get('boardCardList', List<BoardCard>());
        if (newList) {
            idList.forEach(id => { newList = newList.filter(value => value.get('card').get('_id') !== id) });
        }
        newEntry = newEntry.set('boardCardList', newList);

        return {
            ...state,
            boardMap: state.boardMap.set(boardName, newEntry),
        };
    }),
    reset: () => set(state => {
        return { ...state, boardMap: Map() };
    }),
}));