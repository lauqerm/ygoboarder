import create from 'zustand';

export type ElementGroupState = {
    elementGroup: Record<string, HTMLElement[]>,
    addToGroup: (groupName: string, elementList: HTMLElement[]) => void,
    replaceGroup: (groupName: string, elementList: HTMLElement[]) => void,
}
export const useCardGroupState = create<ElementGroupState>(set => ({
    elementGroup: {},

    addToGroup: (groupName, elementList) => set(state => {
        const newElementGroup = { ...state.elementGroup };
        if (!newElementGroup[groupName]) newElementGroup[groupName] = [];
        newElementGroup[groupName] = [
            ...newElementGroup[groupName],
            ...elementList,
        ];

        return {
            ...state,
            elementGroup: newElementGroup,
        };
    }),
    replaceGroup: (groupName, elementList) => set(state => {
        const newElementGroup = { ...state.elementGroup };
        newElementGroup[groupName] = elementList;

        return {
            ...state,
            elementGroup: newElementGroup,
        };
    }),
}));