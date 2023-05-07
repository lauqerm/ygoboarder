import create from 'zustand';

export type PreviewState = {
    cardPreview: {
        type: 'internal' | 'external',
        data: string,
        dataURL: string,
    },
    setCardPreview: (data: string, type: 'internal' | 'external') => void,
};
export const usePreviewStore = create<PreviewState>((set) => ({
    cardPreview: {
        type: 'internal',
        data: '',
        dataURL: '',
    },
    setCardPreview: (data, type) => set(state => {
        if ((data ?? '').length <= 0) return state;
        if (type === 'external') return {
            ...state,
            cardPreview: {
                dataURL: data,
                data: '',
                type: 'external',
            },
        };
        return {
            ...state,
            cardPreview: {
                dataURL: '',
                data,
                type: 'internal',
            },
        };
    }),
}));