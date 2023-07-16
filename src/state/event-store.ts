import create from 'zustand';

export type EventState = {
    editDescriptionSignal: number,
    editDescription: () => void,
    escapeModalSignal: number,
    escapeModal: () => void,
};
export const useEventState = create<EventState>((set) => ({
    editDescriptionSignal: 0,
    editDescription: () => set(state => {
        return {
            ...state,
            editDescriptionSignal: state.editDescriptionSignal + 1,
        };
    }),
    escapeModalSignal: 0,
    escapeModal: () => set(state => {
        return {
            ...state,
            escapeModalSignal: state.escapeModalSignal + 1,
        };
    }),
}));