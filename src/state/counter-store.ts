import { Parser } from 'expr-eval';
import create from 'zustand';

export const REMOVE_ALL_COUNTER = 'remove';

export type CounterState = {
    activeCounter?: string,
    counterMap: Record<string, Record<string, number> | undefined>,
    set: (cardId: string, counterName?: string, expression?: string) => void,
    setCounterMode: (counterName?: string) => void,
};
export const useCounterState = create<CounterState>((set) => ({
    activeCounter: undefined,
    counterMap: {},
    set: (cardId, counterName, expression) => set(state => {
        const nextMap = { ...state.counterMap };
        if (!nextMap[cardId]) nextMap[cardId] = {};

        if (counterName) {
            const cardCounterMap = { ...nextMap[cardId] };

            if (expression === REMOVE_ALL_COUNTER) {
                delete cardCounterMap[counterName];
            } else {
                cardCounterMap[counterName] = expression
                    ? Parser.evaluate(expression)
                    : (cardCounterMap[counterName] ?? 0) + 1;
            }

            nextMap[cardId] = cardCounterMap;
        } else {
            delete nextMap[cardId];
        }

        return {
            ...state,
            counterMap: nextMap,
        };
    }),
    setCounterMode: counterName => set(state => {
        return {
            ...state,
            activeCounter: counterName,
        };
    }),
}));