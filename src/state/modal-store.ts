import { Record as ImmutableRecord, Map } from 'immutable';
import create from 'zustand';

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
            currentFocus: '',
            modalMap: state.modalMap.setIn([name, 'zIndex'], 0),
        };
    }),
}));