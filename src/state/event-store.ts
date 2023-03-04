import create from 'zustand';

/** @todo Possibly deprecated */
export type CardEventState = {
    isDraggingBoardCard: boolean,
    setDraggingBoardCardStatus: (newStatus: boolean) => void,

    dragFromDeckButtonToBoardData: {
        _index: number,
        cardIndex: number,
        cardCoord: { top: number, left: number },
        deckID: string,
    },
    dragFromDeckButtonToBoard: (cardIndex: number, deckID: string, cardCoord: { top: number, left: number }) => void,
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
        cardCoord: { top: 0, left: 0 },
        deckID: '',
    },
    dragFromDeckButtonToBoard: (cardIndex, deckID, cardCoord) => set(state => {
        return {
            ...state,
            dragFromDeckButtonToBoardData: {
                _index: state.dragFromDeckButtonToBoardData._index + 1,
                cardIndex,
                cardCoord,
                deckID,
            },
        };
    }),
}));
