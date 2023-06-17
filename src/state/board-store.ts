import { List, Record as ImmutableRecord, Map } from 'immutable';
import { BaseCard, CardImageConverter, PhaseType, Position } from 'src/model';
import create from 'zustand';
import { BaseDeckCard } from './deck-store';

type BaseBoardCard = BaseDeckCard & {
    initialX: number,
    initialY: number,
    phase: PhaseType,
    position: Position,
};
export type BoardCard = ImmutableRecord<BaseBoardCard>;
export const BoardCardConverter = ImmutableRecord<BaseBoardCard>({
    card: CardImageConverter(),
    origin: '',
    initialX: 0,
    initialY: 0,
    phase: 'up',
    position: 'atk',
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
    add: (boardName: string, cardList: { card: BaseCard, initialX: number, initialY: number, origin: string, phase: PhaseType }[]) => void,
    delete: (boardName: string, idList: string[]) => void,
    changePosition: (boardName: string, affectList: { id: string, position?: Position }[]) => void,
    changePhase: (boardName: string, affectList: { id: string, phase?: PhaseType }[]) => void,
    reset: () => void,
}
export const useBoardState = create<BoardState>((set) => ({
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
    changePosition: (boardName, affectList) => set(state => {
        let newEntry = state.boardMap.get(boardName, BoardEntryConverter());
        let newList = newEntry.get('boardCardList', List<BoardCard>());
        const affectMap = affectList.reduce((prev, curr) => ({ ...prev, [curr.id]: curr }), {} as Record<string, { id: string, position?: Position }>);
        if (newList) {
            newList = newList.map(card => {
                const id = card.get('card').get('_id');
                const affectedEntry = affectMap[id];

                if (affectedEntry) {
                    const oldPosition = card.get('position');
                    const newPosition = affectedEntry.position !== undefined
                        ? affectedEntry.position
                        : (oldPosition === 'atk' ? 'def' : 'atk');

                    return card.set('position', newPosition);
                }
                return card;
            });
        }
        newEntry = newEntry.set('boardCardList', newList);

        return {
            ...state,
            boardMap: state.boardMap.set(boardName, newEntry),
        };
    }),
    changePhase: (boardName, affectList) => set(state => {
        let newEntry = state.boardMap.get(boardName, BoardEntryConverter());
        let newList = newEntry.get('boardCardList', List<BoardCard>());
        const affectMap = affectList.reduce((prev, curr) => ({ ...prev, [curr.id]: curr }), {} as Record<string, { id: string, phase?: PhaseType }>);
        if (newList) {
            newList = newList.map(card => {
                const id = card.get('card').get('_id');
                const affectedEntry = affectMap[id];

                if (affectedEntry) {
                    const oldPhase = card.get('phase');
                    const newPhase = affectedEntry.phase !== undefined
                        ? affectedEntry.phase
                        : (oldPhase === 'down' ? 'up' : 'down');

                    return card.set('phase', newPhase);
                }
                return card;
            });
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