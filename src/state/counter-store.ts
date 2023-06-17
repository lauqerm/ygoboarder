import create from 'zustand';

export type CounterState = {
    countMap: Record<string, number>
    set: (deckId: string, amount?: number) => void,
};
export const useCounterState = create<CounterState>((set) => ({
    countMap: {},
    set: (deckId, amount = 1) => set(state => {
        const nextMap = { ...state.countMap };
        if (!nextMap[deckId]) nextMap[deckId] = 0;
        nextMap[deckId] += amount;

        return {
            ...state,
            countMap: nextMap,
        };
    }),
}));