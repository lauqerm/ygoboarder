import {
    BeaconAction,
    BEACON_CLASS,
    CLASS_BEACON_WRAPPER,
    DOMEntityType,
    DOM_ENTITY_CLASS,
    PropDOMEntityName,
    PropDOMEntityType,
    PROP_BEACON_ACTION_TYPE,
    PROP_BEACON_DECK_ORIGIN,
} from 'src/model';
import create from 'zustand';

type DOMEntity = {
    name: string,
    type: DOMEntityType,
    left: number,
    top: number,
    right: number,
    bottom: number,
    zIndex: number,
    element: () => HTMLElement,
    beaconList: {
        id: string,
        left: number,
        top: number,
        right: number,
        bottom: number,
        type: BeaconAction,
        beaconElement: () => HTMLElement,
    }[]
}
export type DOMEntityState = {
    DOMEntityMap: Record<DOMEntityType, Record<string, DOMEntity>>,
    DOMEntityList: DOMEntity[],
    DOMEntityListTypeMap: Record<DOMEntityType, string[]>,

    addDOMEntity: (ref: HTMLElement, type: DOMEntityType, beaconRefList?: HTMLElement[]) => void,

    recalculateCount: number,
    recalculate: () => void,
}
export const useDOMEntityStateStore = create<DOMEntityState>(set => ({
    DOMEntityMap: {
        [DOMEntityType['board']]: {},
        [DOMEntityType['deckButton']]: {},
        [DOMEntityType['deckModal']]: {},
    },
    DOMEntityList: [],
    DOMEntityListTypeMap: {
        [DOMEntityType['board']]: [],
        [DOMEntityType['deckButton']]: [],
        [DOMEntityType['deckModal']]: [],
    },

    addDOMEntity: (ref: HTMLElement, type: DOMEntityType, beaconRefList?: HTMLElement[]) => set(state => {
        const name = ref.getAttribute(PropDOMEntityName) ?? 'Default';
        const newDOMEntity: DOMEntity = {
            name,
            type,
            zIndex: 0,
            bottom: 0,
            left: 0,
            top: 0,
            right: 0,
            element: () => ref,
            beaconList: (beaconRefList ?? []).map(beacon => {
                return {
                    beaconElement: () => beacon,
                    id: '',
                    type: 'shuffle',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                };
            }),
        };

        const { DOMEntityList, DOMEntityListTypeMap, DOMEntityMap } = state;
        const isReplaced = !!(DOMEntityMap[type][name] as DOMEntity | undefined);

        const nextDOMEntityMap = { ...DOMEntityMap };
        nextDOMEntityMap[type][name] = newDOMEntity;

        const nextDOMEntityList = isReplaced
            ? DOMEntityList.map(entry => {
                if (entry.name === name && entry.type === type) return newDOMEntity;
                return entry;
            })
            : [...DOMEntityList, newDOMEntity];

        const nextDOMEntityListTypeMap = {
            ...DOMEntityListTypeMap,
            [type]: isReplaced
                ? DOMEntityListTypeMap[type]
                : [...DOMEntityListTypeMap[type], name],
        };

        return {
            ...state,
            DOMEntityMap: nextDOMEntityMap,
            DOMEntityList: nextDOMEntityList,
            DOMEntityListTypeMap: nextDOMEntityListTypeMap,
        };
    }),

    recalculateCount: 0,
    recalculate: () => set(state => {
        /**
         * `board`: .${DOM_ENTITY_CLASS}
         * `deckButton` và `deckModal`: .${DOM_ENTITY_CLASS} .${CLASS_BEACON_WRAPPER}
         */
        const { DOMEntityList: currentDOMEntityList, recalculateCount } = state;
        const unsortedDOMEntityList: DOMEntity[] = [];
        console.log('🚀 ~ file: dom-entity-store.ts:122 ~ useDOMEntityStateStore ~ type', currentDOMEntityList);

        for (const DOMEntity of currentDOMEntityList) {
            const { element, beaconList } = DOMEntity;
            const DOMElement = element();
            const name = DOMElement.getAttribute(PropDOMEntityName) ?? 'Default';
            const type = (DOMElement.getAttribute(PropDOMEntityType) ?? 'Default') as DOMEntityType;
            const zIndex = parseInt(DOMElement.style.zIndex);
            const { left, top, right, bottom } = DOMElement.getBoundingClientRect();

            if (!isNaN(zIndex)) {
                const nextDOMEntityBeaconList: typeof unsortedDOMEntityList[0] = {
                    name, type,
                    left, top, right, bottom,
                    element,
                    zIndex,
                    beaconList: [],
                };

                for (const DOMBeaconEntity of beaconList) {
                    const { beaconElement } = DOMBeaconEntity;
                    const DOMBeaconElement = beaconElement();
                    const beaconInfo = DOMBeaconElement.getAttribute('data-deck-beacon');

                    if (beaconInfo) {
                        const beaconType = DOMBeaconElement.getAttribute(PROP_BEACON_ACTION_TYPE) as BeaconAction | null;
                        const deckId = DOMBeaconElement.getAttribute(PROP_BEACON_DECK_ORIGIN);

                        if (deckId && beaconType) {
                            const { left, top, right, bottom } = DOMBeaconElement.getBoundingClientRect();

                            nextDOMEntityBeaconList.beaconList.push({
                                id: deckId,
                                type: beaconType,
                                left, top, right, bottom,
                                beaconElement,
                            });
                        }
                    }
                }
                unsortedDOMEntityList.push(nextDOMEntityBeaconList);
            }
        }

        const nextDOMEntityMap: typeof state['DOMEntityMap'] = {
            [DOMEntityType['board']]: {},
            [DOMEntityType['deckButton']]: {},
            [DOMEntityType['deckModal']]: {},
        };
        const nextDOMEntityList: typeof state['DOMEntityList'] = [];
        const nextDOMEntityListTypeMap: typeof state['DOMEntityListTypeMap'] = {
            [DOMEntityType['board']]: [],
            [DOMEntityType['deckButton']]: [],
            [DOMEntityType['deckModal']]: [],
        };
        const sortedDOMEntityList = unsortedDOMEntityList.sort((l, r) => r.zIndex - l.zIndex);

        for (const DOMEntityInfo of sortedDOMEntityList) {
            const { type, name } = DOMEntityInfo;

            nextDOMEntityList.push(DOMEntityInfo);
            nextDOMEntityListTypeMap[type].push(name);
            nextDOMEntityMap[type][name] = DOMEntityInfo;
        }

        console.log('after calculation', nextDOMEntityList, recalculateCount + 1);
        return {
            ...state,
            recalculateCount: recalculateCount + 1,
            DOMEntityList: nextDOMEntityList,
            DOMEntityListTypeMap: nextDOMEntityListTypeMap,
            DOMEntityMap: nextDOMEntityMap,
        };
    }),
}));