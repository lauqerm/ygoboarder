import create from 'zustand';

export type PreviewState = {
    isModalMode: boolean,
    cardPreview: {
        type: 'internal' | 'external',
        data: string,
        dataURL: string,
        description: string,
        isOfficial: boolean,
    },
    setCardPreview: (
        mode: 'side' | 'modal',
        type: 'internal' | 'external',
        data: string,
        isOfficial: boolean,
        description?: string,
    ) => void,
    setPreviewMode: (mode: 'side' | 'modal') => void,
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
    setPreviewMode: mode => set(state => {
        return {
            ...state,
            isModalMode: mode === 'modal' ? true : false,
        };
    }),
    setCardPreview: (mode, type, data, isOfficial, description = '') => set(state => {
        if ((data ?? '').length <= 0) return state;
        return {
            ...state,
            isModalMode: mode === 'modal' ? true : false,
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