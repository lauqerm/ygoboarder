import { List, Record as ImmutableRecord, Map } from 'immutable';
import { BEACON_ACTION, CardImage, CardImageConverter, DeckType } from 'src/model';
import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { shuffleDeck } from 'src/service';

export type BaseDeckCard = {
    card: CardImage,
    origin: string,
};
export type DeckCard = ImmutableRecord<BaseDeckCard>;
export const DeckCardConverter = ImmutableRecord<BaseDeckCard>({
    card: CardImageConverter(),
    origin: '',
});

export type BaseDeckList = {
    name: string,
    type: DeckType,
    cardList: List<DeckCard>,
};
export type DeckList = ImmutableRecord<BaseDeckList>;
export const DeckListConverter = ImmutableRecord<BaseDeckList>({
    name: '',
    cardList: List(),
    type: DeckType['none'],
});
export type DeckState = {
    deckMap: Map<string, DeckList>,
    register: (deckId: string, type: DeckType) => void,
    add: (deckId: string, cardList: CardImage[], position?: BEACON_ACTION) => void,
    addToPosition: (deckId: string, cardWithPositionList: { position: number, card: DeckCard }[]) => void,
    delete: (deckId: string, idList: string[]) => void,
    duplicate: (deckId: string, cardList: DeckCard[]) => void,
    reorder: (deckId: string, changeList: { prevIndex: number, nextIndex: number }[]) => void,
    shuffle: (deckId: string,) => void,
    reset: () => void,
}
export const useDeckStore = create<DeckState>((set) => ({
    deckMap: Map(),
    register: (deckId, type) => set(state => {
        if (state.deckMap.has(deckId)) return state;
        const newDeck = DeckListConverter({
            cardList: List(),
            name: deckId,
            type,
        });

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    add: (deckId, cardList, position = 'bottom') => set(state => {
        const targetDeck = state.deckMap.get(deckId, DeckListConverter());
        let newList = targetDeck.get('cardList');
        if (newList) {
            if (position === 'bottom') cardList.forEach(card => { newList = newList.push(DeckCardConverter({ card, origin: deckId })) });
            if (position === 'top') cardList.forEach(card => { newList = newList.unshift(DeckCardConverter({ card, origin: deckId })) });
            if (position === 'shuffle') {
                cardList.forEach(card => { newList = newList.push(DeckCardConverter({ card, origin: deckId })) });
                newList = shuffleDeck(newList);
            }
        }
        const newDeck = targetDeck.set('cardList', newList);

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    addToPosition: (deckId, cardWithPositionList) => set(state => {
        const targetDeck = state.deckMap.get(deckId, DeckListConverter());
        let newList = targetDeck.get('cardList');
        if (newList) {
            cardWithPositionList.forEach(({ card, position }) => {
                newList = newList.splice(position, 0, card.set('origin', deckId));
            });
        }
        const newDeck = targetDeck.set('cardList', newList);

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    delete: (deckId, idList) => set(state => {
        const targetDeck = state.deckMap.get(deckId, DeckListConverter());
        let newList = targetDeck.get('cardList');
        if (newList) {
            idList.forEach(id => { newList = newList.filter(value => value.get('card').get('_id') !== id) });
        }
        const newDeck = targetDeck.set('cardList', newList);

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    duplicate: (deckId, cardList) => set(state => {
        const targetDeck = state.deckMap.get(deckId, DeckListConverter());
        let newList = targetDeck.get('cardList');
        if (newList) {
            cardList.forEach(card => {
                const targetIndex = newList.findIndex(deckElement => deckElement.get('card').get('_id') === card.get('card').get('_id'));

                newList = newList.splice(targetIndex, 0, card.setIn(['card', '_id'], uuidv4()));
            });
        }
        const newDeck = targetDeck.set('cardList', newList);

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    reorder: (deckId, changeList) => set(state => {
        let newList = state.deckMap.get(deckId, DeckListConverter()).get('cardList');

        if (newList) {
            changeList.forEach(({ prevIndex, nextIndex }) => {
                const toBeRemovedItem = newList.get(prevIndex);
                const listAfterRemove = newList.remove(prevIndex);
                if (toBeRemovedItem) newList = listAfterRemove.splice(nextIndex, 0, toBeRemovedItem);
            });
        }
        const newDeck = state.deckMap.get(deckId, DeckListConverter()).set('cardList', newList);

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    shuffle: (deckId) => set(state => {
        const targetList = state.deckMap.get(deckId, DeckListConverter()).get('cardList');

        if (targetList) {
            const newDeck = state.deckMap.get(deckId, DeckListConverter()).set('cardList', shuffleDeck(targetList));
            return {
                ...state,
                deckMap: state.deckMap.set(deckId, newDeck),
            };
        }
        return state;
    }),
    reset: () => set(state => {
        return { ...state, deckMap: Map() };
    }),
}));