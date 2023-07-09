import create from 'zustand';

export type EventState = {
    editDescriptionSignal: number,
    editDescription: () => void,
};
export const useEventState = create<EventState>((set) => ({
    editDescriptionSignal: 0,
    editDescription: () => set(state => {
        return {
            ...state,
            editDescriptionSignal: state.editDescriptionSignal + 1,
        };
    }),
}));