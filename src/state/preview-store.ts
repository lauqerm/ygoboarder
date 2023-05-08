import create from 'zustand';

export type PreviewState = {
    cardPreview: {
        type: 'internal' | 'external',
        data: string,
        dataURL: string,
        description: string,
    },
    setCardPreview: (type: 'internal' | 'external', data: string, description?: string) => void,
};
export const usePreviewStore = create<PreviewState>((set) => ({
    cardPreview: {
        type: 'internal',
        data: '',
        dataURL: '',
        description: '',
    },
    setCardPreview: (type, data, description = '') => set(state => {
        if ((data ?? '').length <= 0) return state;
        if (type === 'external') return {
            ...state,
            cardPreview: {
                dataURL: data,
                data: '',
                type: 'external',
                description,
            },
        };
        return {
            ...state,
            cardPreview: {
                dataURL: '',
                data,
                type: 'internal',
                description,
            },
        };
    }),
}));