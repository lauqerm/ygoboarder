import create from 'zustand';

export type CardEventState = {
    isDraggingBoardCard: boolean,
    setDraggingBoardCardStatus: (newStatus: boolean) => void,

    dragFromDeckButtonToBoardData: {
        _index: number,
        cardIndex: number,
        deckID: string,
    },
    dragFromDeckButtonToBoard: (cardIndex: number, deckID: string) => void,
}
export const useCardEventStore = create<CardEventState>((set) => ({
    isDraggingBoardCard: false,
    setDraggingBoardCardStatus: newStatus => set(state => {
        return {
            ...state,
            isDraggingBoardCard: newStatus,
        };
    }),

    dragFromDeckButtonToBoardData: {
        _index: -1,
        cardIndex: -1,
        deckID: '',
    },
    dragFromDeckButtonToBoard: (cardIndex, deckID) => set(state => {
        return {
            ...state,
            dragFromDeckButtonToBoardData: {
                _index: state.dragFromDeckButtonToBoardData._index + 1,
                cardIndex,
                deckID,
            },
        };
    }),
}));