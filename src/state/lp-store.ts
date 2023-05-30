import { Parser } from 'expr-eval';
import create from 'zustand';

export type LPState = {
    lpMap: Record<string, number>,
    set: (targetId: string, expression: string) => void,
};
export const useLPStore = create<LPState>((set) => ({
    lpMap: {},
    set: (targetId, expression) => set(state => {
        const nextMap = { ...state.lpMap };
        if (!nextMap[targetId]) nextMap[targetId] = 0;
        try {
            nextMap[targetId] = Parser.evaluate(expression);
        } catch (e) {
            nextMap[targetId] = 0;
        }

        return {
            ...state,
            lpMap: nextMap,
        };
    }),
}));