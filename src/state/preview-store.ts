import create from 'zustand';

export type CardPreview = {
    type: 'internal' | 'external',
    data: string,
    dataURL: string,
    description: string,
    isOfficial: boolean,
};
export type PreviewState = {
    isModalMode: boolean,
    cardPreview: CardPreview,
    setCardPreview: (
        layout: 'side' | 'modal' | 'keep',
        type: 'internal' | 'external',
        data: string,
        isOfficial: boolean,
        description?: string,
    ) => void,
    setPreview: (layout: 'side' | 'modal') => void,
};
export const usePreviewState = create<PreviewState>((set) => ({
    isModalMode: false,
    cardPreview: {
        type: 'internal',
        data: '',
        dataURL: '',
        description: '',
        isOfficial: false,
    },
    setPreview: layout => set(state => {
        return {
            ...state,
            isModalMode: layout === 'modal' ? true : false,
        };
    }),
    setCardPreview: (layout, type, data, isOfficial, description = '') => set(state => {
        if ((data ?? '').length <= 0) return state;
        const { isModalMode } = state;
        return {
            ...state,
            isModalMode: layout === 'keep'
                ? isModalMode
                : layout === 'modal' ? true : false,
            cardPreview: type === 'external'
                ? {
                    dataURL: data,
                    data: '',
                    type: 'external',
                    description,
                    isOfficial,
                }
                : {
                    dataURL: '',
                    data,
                    type: 'internal',
                    description,
                    isOfficial,
                },
        };
    }),
}));