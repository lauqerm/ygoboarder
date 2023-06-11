import create from 'zustand';

export type PreviewState = {
    cardPreview: {
        type: 'internal' | 'external',
        data: string,
        dataURL: string,
        description: string,
        isOfficial: boolean,
    },
    setCardPreview: (type: 'internal' | 'external', data: string, isOfficial: boolean, description?: string) => void,
};
export const usePreviewStore = create<PreviewState>((set) => ({
    cardPreview: {
        type: 'internal',
        data: '',
        dataURL: '',
        description: '',
        isOfficial: false,
    },
    setCardPreview: (type, data, isOfficial, description = '') => set(state => {
        if ((data ?? '').length <= 0) return state;
        if (type === 'external') return {
            ...state,
            cardPreview: {
                dataURL: data,
                data: '',
                type: 'external',
                description,
                isOfficial,
            },
        };
        return {
            ...state,
            cardPreview: {
                dataURL: '',
                data,
                type: 'internal',
                description,
                isOfficial,
            },
        };
    }),
}));