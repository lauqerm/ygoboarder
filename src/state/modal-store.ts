import { List, Record as ImmutableRecord, Map } from 'immutable';
import { CardImage, CardImageConverter, DeckType, DECK_TYPE } from 'src/model';
import create from 'zustand';
import { BaseDeckCard } from './deck-store';

type BaseModalInstance = {
    name: string,
    zIndex: number,
};
export type ModalInstance = ImmutableRecord<BaseModalInstance>;
export const ModalInstanceConverter = ImmutableRecord<BaseModalInstance>({
    name: '',
    zIndex: 0,
});

export type ModalState = {
    highestIndex: number,
    currentFocus: string,
    modalMap: Map<string, ModalInstance>,
    increase: (name: string) => void,
    reset: (name: string) => void,
}
export const useModalStore = create<ModalState>((set) => ({
    highestIndex: 0,
    modalMap: Map(),
    currentFocus: '',
    increase: name => set(state => {
        const nextHighestIndex = state.highestIndex + 1;
        console.log('🚀 ~ file: modal-store.ts ~ line 29 ~ useModalStore ~ nextHighestIndex', nextHighestIndex);
        if (state.currentFocus === name) return state;
        if (!state.modalMap.has(name)) {
            state.modalMap = state.modalMap.set(name, ModalInstanceConverter({ name, zIndex: nextHighestIndex }));
        }

        return {
            ...state,
            currentFocus: name,
            highestIndex: nextHighestIndex,
            modalMap: state.modalMap.setIn([name, 'zIndex'], nextHighestIndex),
        };
    }),
    reset: name => set(state => {
        if (!state.modalMap.has(name)) {
            state.modalMap = state.modalMap.set(name, ModalInstanceConverter({ name, zIndex: 0 }));
        }

        return {
            ...state,
            modalMap: state.modalMap.setIn([name, 'zIndex'], 0),
        };
    }),
}));