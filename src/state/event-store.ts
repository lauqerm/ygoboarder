import create from 'zustand';

export type CardEventState = {
    isDraggingBoardCard: boolean,
    setDraggingBoardCardStatus: (newStatus: boolean) => void,
}
export const useCardEventStore = create<CardEventState>((set) => ({
    isDraggingBoardCard: false,
    setDraggingBoardCardStatus: newStatus => set(state => {
        return {
            ...state,
            isDraggingBoardCard: newStatus,
        };
    }),
}));