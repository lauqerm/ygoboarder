import create from 'zustand';

export type DescriptionState = {
    descriptionMap: Record<string, string>
    set: (valueList: { key?: string, description?: string }[], force?: boolean) => void,
};
export const useDescriptionStore = create<DescriptionState>((set) => ({
    descriptionMap: {},
    set: (valueList, force = false) => set(state => {
        const nextMap = { ...state.descriptionMap };
        valueList.forEach(({ key, description }) => {
            if (typeof key === 'string' && key.length > 0) {
                if ((nextMap[key] ?? '').length <= 0 || force) nextMap[key] = description ?? '';
            }
        });

        return {
            ...state,
            descriptionMap: nextMap,
        };
    }),
}));