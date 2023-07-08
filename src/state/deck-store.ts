import { List, Record as ImmutableRecord, Map } from 'immutable';
import { BeaconAction, BaseCard, CardImageConverter, CardPreset, DeckType, PhaseType, NeutralBoardComponentMap, NeutalFieldComponentKey } from 'src/model';
import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { shuffleDeck } from 'src/util';

export type BaseDeckCard = {
    card: BaseCard,
    origin: string,
    phase: PhaseType,
};
export type DeckCard = ImmutableRecord<BaseDeckCard>;
export const DeckCardConverter = ImmutableRecord<BaseDeckCard>({
    card: CardImageConverter(),
    origin: '',
    phase: 'up',
});

export type PhaseBehavior = 'always-up' | 'always-down' | 'keep';

export type BaseDeckList = {
    name: string,
    type: DeckType,
    phaseBehavior: PhaseBehavior,
    defaultPhase: PhaseType,
    preset: CardPreset,
    cardList: List<DeckCard>,
};
export type DeckList = ImmutableRecord<BaseDeckList>;
export const DeckListConverter = ImmutableRecord<BaseDeckList>({
    name: '',
    cardList: List(),
    type: DeckType['none'],
    phaseBehavior: 'keep',
    defaultPhase: 'down',
    preset: 'your',
});
export type DeckState = {
    deckMap: Map<string, DeckList>,
    register: (deckId: string, info: { type: DeckType, defaultPhase: PhaseType, phaseBehavior: PhaseBehavior, preset: CardPreset }) => void,
    add: (deckId: string, addInfo: { card: BaseCard, phase?: PhaseType }[], position?: BeaconAction, replace?: boolean) => void,
    addToPosition: (deckId: string, cardWithPositionList: { position: number, card: DeckCard }[]) => void,
    delete: (deckId: string, idList: string[], force?: boolean) => void,
    duplicate: (deckId: string, cardList: DeckCard[]) => void,
    reorder: (deckId: string, changeList: { prevIndex: number, nextIndex: number }[]) => void,
    flip: (deckId: string, changeList: { id: string, phase: PhaseType | 'toggle' }[]) => void,
    shuffle: (deckId: string) => void,
    reset: () => void,
}
export const useDeckState = create<DeckState>((set) => ({
    deckMap: Map({
        [NeutralBoardComponentMap[NeutalFieldComponentKey.tokenPile].name]: DeckListConverter({
            type: DeckType['none'],
            preset: 'your',
            name: 'TOKEN-PILE',
            defaultPhase: 'up',
            phaseBehavior: 'always-up',
            cardList: List([
                'https://images.ygoprodeck.com/images/cards/73915052.jpg',
                'https://images.ygoprodeck.com/images/cards/71645243.jpg',
                'https://images.ygoprodeck.com/images/cards/59160189.jpg',
                'https://images.ygoprodeck.com/images/cards/52340445.jpg',
                'https://images.ygoprodeck.com/images/cards/39972130.jpg',
                'https://images.ygoprodeck.com/images/cards/90884404.jpg',
                'https://images.ygoprodeck.com/images/cards/15341822.jpg',
                'https://images.ygoprodeck.com/images/cards/904186.jpg',
                'https://images.ygoprodeck.com/images/cards/53855410.jpg',
                'https://images.ygoprodeck.com/images/cards/9929399.jpg',
            ].map(image => {
                return DeckCardConverter({
                    card: CardImageConverter({
                        _id: uuidv4(),
                        dataURL: image,
                        isOfficial: true,
                        isToken: true,
                        preset: 'your',
                        type: 'external',
                    }),
                    origin: 'TOKEN-PILE',
                    phase: 'up',
                });
            })),
        }),
    }),
    register: (deckId, deckInfo) => set(state => {
        const { type, defaultPhase, phaseBehavior, preset } = deckInfo;
        const existedDeck = state.deckMap.get(deckId, DeckListConverter());
        let newDeck = DeckListConverter({
            cardList: List(),
            name: deckId,
            type,
            defaultPhase,
            phaseBehavior,
            preset,
        });
        const isSameDeck = (existedDeck.get('defaultPhase') === newDeck.get('defaultPhase'))
            && (existedDeck.get('phaseBehavior') === newDeck.get('phaseBehavior'))
            && (existedDeck.get('preset') === newDeck.get('preset'))
            && (existedDeck.get('name') === newDeck.get('name'))
            && (existedDeck.get('type') === newDeck.get('type'));
        if (isSameDeck) newDeck = newDeck.set('cardList', existedDeck.get('cardList'));

        return {
            ...state,
            deckMap: state.deckMap.set(deckId, newDeck),
        };
    }),
    add: (deckId, addInfo, position = 'bottom', replace = false) => set(state => {
        const targetDeck = state.deckMap.get(deckId, DeckListConverter());
        let newList = replace ? targetDeck.get('cardList') : List<DeckCard>();
        const phaseBehavior = targetDeck.get('phaseBehavior');
        const resolvePhase = (phase: PhaseType = targetDeck.get('defaultPhase')): PhaseType => {
            return phaseBehavior === 'keep'
                ? phase
                : phaseBehavior === 'always-down'
                    ? 'down'
                    : 'up';
        };
        if (newList) {
            if (position === 'bottom') addInfo.forEach(info => {
                const { card, phase } = info;
                newList = newList.push(DeckCardConverter({
                    card,
                    origin: deckId,
                    phase: resolvePhase(phase),
                }));
            });
            if (position === 'top') addInfo.forEach(info => {
                const { card, phase } = info;
                newList = newList.unshift(DeckCardConverter({
                    card,
                    origin: deckId,
                    phase: resolvePhase(phase),
                }));
            });
            if (position === 'shuffle') {
                addInfo.forEach(info => {
                    const { card, phase } = info;
                    newList = newList.push(DeckCardConverter({
                        card,
                        origin: deckId,
                        phase: resolvePhase(phase),
                    }));
                });
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
    delete: (deckId, idList, force = false) => set(state => {
        const targetDeck = state.deckMap.get(deckId, DeckListConverter());
        /** Card không bị delete trong deck dạng permanent và none, nhưng vì card có id duy nhất nên ta xóa card đó và clone nó với id mới */
        const cloneInstead = (targetDeck.get('type') === 'permanent' || targetDeck.get('type') === 'none')
            && force === false;

        let newList = targetDeck.get('cardList');
        if (newList) {
            idList.forEach(cardId => {
                if (cloneInstead) {
                    const targetIndex = newList.findIndex(deckElement => deckElement.get('card').get('_id') === cardId);
                    const targetCard = newList.get(targetIndex);

                    if (targetCard) newList = newList.splice(targetIndex, 1, targetCard.setIn(['card', '_id'], uuidv4()));
                }
                else newList = newList.filter(value => value.get('card').get('_id') !== cardId);
            });
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
    flip: (deckId, changeList) => set(state => {
        let newList = state.deckMap.get(deckId, DeckListConverter()).get('cardList');
        const changeMap = changeList.reduce((prev, curr) => {
            return { ...prev, [curr.id]: curr.phase };
        }, {} as Record<string, PhaseType | 'toggle'>);

        if (newList) {
            newList = newList.map(entry => {
                const newPhase = changeMap[entry.get('card').get('_id')];

                if (newPhase) {
                    const currentPhase = entry.get('phase');

                    return entry.set(
                        'phase',
                        newPhase === 'toggle'
                            ? (currentPhase === 'down' ? 'up' : 'down')
                            : newPhase,
                    );
                }
                return entry;
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