import create from 'zustand';
import throttle from 'lodash.throttle';

export type DroppableState = {
    statusMap: Record<string, boolean>,
    update: (transformer: (currentState: Record<string, boolean>) => Record<string, boolean>) => void,
}
export const useDroppableAvailableState = create<DroppableState>(set => ({
    statusMap: {},

    update: throttle((transformer) => set(state => {
        return {
            ...state,
            statusMap: transformer({ ...state.statusMap }),
        };
    }), 100),
}));