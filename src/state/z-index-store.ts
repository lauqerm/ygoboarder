import { Record as ImmutableRecord, Map } from 'immutable';
import { MIN_ABSOLUTE_INDEX, MIN_CARD_INDEX, MIN_MODAL_INDEX } from 'src/model';
import { createIndexQueue } from 'src/service';
import create from 'zustand';

export const cardIndexQueue = createIndexQueue(10);

type BaseZIndexInstance = {
    name: string,
    zIndex: number,
};
export type ZIndexInstance = ImmutableRecord<BaseZIndexInstance>;
export const ZIndexInstanceConverter = ImmutableRecord<BaseZIndexInstance>({
    name: '',
    zIndex: 0,
});

type IndexCategoryData = {
    topIndex: number,
    currentFocus: string,
    posToZIndex: (pos: number) => number,
    zIndexToPos: (zIndex: number) => number,
    queueLength: number,
    queueMap: Map<string, ZIndexInstance>,
    queueList: (BaseZIndexInstance | undefined)[],
}
/**
 * Dồn toa entry
 * [1, x, x, 4, 5, 6, x, 8, x, x, x, 12]
 * => [1, 2, 3, 4, 5, 6, x, x, x, x, x, x]
 */
const prune = (category: IndexCategoryData): IndexCategoryData => {
    const { posToZIndex, queueLength, queueList } = category;
    let newEntryMap: Map<string, ZIndexInstance> = Map();
    let newEntryQueue: (BaseZIndexInstance | undefined)[] = [];
    let existCount = 0;
    let nonExistCount = 0;
    for (let cnt = 0; cnt < queueLength; cnt++) {
        const target = queueList[cnt];
        /** Nếu là phần tử có tồn tại, ta dồn nó vào đầu array mới, nếu không ta dồn nó ra sau */
        if (target !== undefined) {
            newEntryQueue[existCount] = { name: target.name, zIndex: posToZIndex(existCount) };
            newEntryMap = newEntryMap.set(target.name, ZIndexInstanceConverter({ name: target.name, zIndex: posToZIndex(existCount) }));
            existCount += 1;
        } else {
            newEntryQueue[queueLength - 1 - nonExistCount] = undefined;
            nonExistCount += 1;
        }
    }

    return {
        ...category,
        queueList: newEntryQueue,
        queueMap: newEntryMap,
        topIndex: existCount,
    };
};

type IndexCategory = 'modal' | 'card';

export type ZIndexState = {
    updateCount: number,
    categoryMap: Record<IndexCategory, IndexCategoryData>,
    toTop: (type: IndexCategory, name: string) => void,
    reset: (type: IndexCategory, name: string) => void,
}
export const useZIndexState = create<ZIndexState>((set) => ({
    updateCount: 0,
    categoryMap: {
        card: {
            currentFocus: '',
            topIndex: 0,
            posToZIndex: pos => pos + MIN_CARD_INDEX,
            zIndexToPos: zIndex => zIndex - MIN_CARD_INDEX,
            queueLength: MIN_MODAL_INDEX - MIN_CARD_INDEX - 5,
            queueMap: Map(),
            queueList: Array(MIN_MODAL_INDEX - MIN_CARD_INDEX - 10).fill(undefined),
        },
        modal: {
            currentFocus: '',
            topIndex: 0,
            posToZIndex: pos => pos * 2 + MIN_MODAL_INDEX,
            zIndexToPos: zIndex => (zIndex - MIN_MODAL_INDEX) / 2,
            queueLength: MIN_ABSOLUTE_INDEX - MIN_MODAL_INDEX - 5,
            queueMap: Map(),
            queueList: Array(MIN_ABSOLUTE_INDEX - MIN_MODAL_INDEX - 10).fill(undefined),
        },
    },
    toTop: (type, name) => set(state => {
        const targetCategory = state.categoryMap[type];

        if (!targetCategory) return state;

        let updatedCategory = targetCategory;
        if (targetCategory.topIndex === targetCategory.queueLength) {
            updatedCategory = prune(targetCategory);
        }
        const { queueList, queueMap, topIndex, posToZIndex, zIndexToPos } = updatedCategory;
        const targetIndex = zIndexToPos(queueMap.get(name, ZIndexInstanceConverter()).get('zIndex'));
        const newIndex = topIndex;

        /**
         * Nếu phần tử lên top đã ở sẵn trong queue, ta remove nó ra rồi thêm lại ở vị trí top queue
         */
        if (targetIndex >= 0) queueList[targetIndex] = undefined;
        queueList[newIndex] = { name, zIndex: posToZIndex(newIndex) };
        updatedCategory.queueMap = queueMap.set(name, ZIndexInstanceConverter({ name, zIndex: posToZIndex(newIndex) }));
        updatedCategory.topIndex += 1;
        updatedCategory.currentFocus = name;

        return {
            ...state,
            updateCount: state.updateCount + 1,
            categoryMap: {
                ...state.categoryMap,
                [type]: updatedCategory,
            },
        };
    }),
    reset: (type, name) => set(state => {
        const targetCategory = state.categoryMap[type];
        const updatedCategory = { ...targetCategory };
        const { queueList, queueMap, zIndexToPos } = updatedCategory;
        const targetIndex = zIndexToPos(queueMap.get(name, ZIndexInstanceConverter()).get('zIndex'));

        if (targetIndex >= 0) {
            queueList[targetIndex] = undefined;
            updatedCategory.queueMap = queueMap.remove(name);
        }

        return {
            ...state,
            updateCount: state.updateCount + 1,
            categoryMap: {
                ...state.categoryMap,
                [type]: updatedCategory,
            },
        };
    }),
}));