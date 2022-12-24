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
    element: HTMLElement,
    beaconList: {
        id: string,
        left: number,
        top: number,
        right: number,
        bottom: number,
        type: BeaconAction,
        beaconElement: HTMLElement,
    }[]
}
export type DOMEntityState = {
    DOMEntityMap: Record<DOMEntityType, Record<string, DOMEntity>>,
    DOMEntityList: { type: DOMEntityType, name: string }[],
    DOMEntityListTypeMap: Record<DOMEntityType, string[]>,

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

    recalculateCount: 0,
    recalculate: () => set(state => {
        const DOMEntityElementList = document.querySelectorAll<HTMLElement>(`.${DOM_ENTITY_CLASS}`);
        const DOMEntityInfoList: DOMEntity[] = [];

        for (let cnt = 0; cnt < DOMEntityElementList.length; cnt++) {
            const element = DOMEntityElementList[cnt];
            const name = element.getAttribute(PropDOMEntityName) ?? 'Default';
            const type = (element.getAttribute(PropDOMEntityType) ?? 'Default') as DOMEntityType;
            const zIndex = parseInt(element.style.zIndex);
            const { left, top, right, bottom } = element.getBoundingClientRect();
            if (!isNaN(zIndex)) {
                const nextDOMEntityBeaconList: typeof DOMEntityInfoList[0] = {
                    name, type,
                    left, top, right, bottom,
                    element: type === 'deckButton' || type === 'deckModal'
                        ? element.querySelectorAll(`.${CLASS_BEACON_WRAPPER}`)[0] as HTMLElement
                        : element,
                    zIndex,
                    beaconList: [],
                };
                const beaconList = element.querySelectorAll<HTMLElement>(`.${BEACON_CLASS}`);
                for (let innerCnt = 0; innerCnt < beaconList.length; innerCnt++) {
                    const beaconElement = beaconList[innerCnt];
                    const beaconInfo = beaconElement.getAttribute('data-deck-beacon');

                    if (beaconInfo) {
                        const beaconType = beaconElement.getAttribute(PROP_BEACON_ACTION_TYPE) as BeaconAction | null;
                        const deckId = beaconElement.getAttribute(PROP_BEACON_DECK_ORIGIN);

                        if (deckId && beaconType) {
                            const { left, top, right, bottom } = beaconElement.getBoundingClientRect();
                            nextDOMEntityBeaconList.beaconList.push({
                                id: deckId,
                                type: beaconType,
                                left, top, right, bottom,
                                beaconElement,
                            });
                        }
                    }
                }
                DOMEntityInfoList.push(nextDOMEntityBeaconList);
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
        DOMEntityInfoList
            .sort((l, r) => r.zIndex - l.zIndex)
            .forEach(entry => {
                const { type, name } = entry;

                nextDOMEntityList.push({ type, name });
                nextDOMEntityListTypeMap[type].push(name);
                nextDOMEntityMap[type][name] = entry;
            });

        console.log('🚀 ~ file: dom-entity-store.ts:121 ~ useDOMEntityStateStore ~ nextDOMEntityMap',
            nextDOMEntityMap,
            nextDOMEntityListTypeMap,
            nextDOMEntityList,
        );
        return {
            ...state,
            recalculateCount: state.recalculateCount + 1,
            DOMEntityList: nextDOMEntityList,
            DOMEntityListTypeMap: nextDOMEntityListTypeMap,
            DOMEntityMap: nextDOMEntityMap,
        };
    }),
}));