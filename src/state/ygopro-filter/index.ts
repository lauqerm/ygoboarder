import axios from 'axios';
import {
    DefaultMonsterMainFrame,
    MonsterMainFrameIndex,
    PickerMode,
    YGOProCard,
    YGOProCardResponse,
} from 'src/model';
import create from 'zustand';
import { normalizeYGOProCardResponse } from './normalize-card';
import { isJsonObjectEqual } from 'src/util';

export type OrderType = typeof OrderList[0]['value'];
export const OrderList = [
    { value: 'name' as const, label: '↑ Name' },
    { value: 'atk' as const, label: '↓ ATK' },
    { value: 'def' as const, label: '↓ DEF' },
    { value: 'level' as const, label: '↓ Level' },
];
export type YGOProStatPayload = {
    firstOperator?: string,
    secondOperator?: string,
    firstValue?: number,
    secondValue?: number,
    regex?: RegExp,
    question?: boolean,
}
export type YGOProRequestorPayload = {
    limit?: number[],
    name?: string,
    desc?: string,
    pendDesc?: string,
    atk?: YGOProStatPayload,
    def?: YGOProStatPayload,
    step?: YGOProStatPayload,
    scale?: YGOProStatPayload,
    card_type?: string[],
    attribute?: string[],
    ability?: { mode: PickerMode, value: number },
    frame?: { mode: PickerMode, value: number },
    marker?: { mode: PickerMode, value: number },
    race?: { mode: PickerMode, value: number },
    st_race?: { mode: PickerMode, value: number },
};
export type YGOProPayloadStringKey = Extract<keyof YGOProRequestorPayload, 'name' | 'desc' | 'pendDesc'>;
export type YGOProPayloadStatKey = Extract<keyof YGOProRequestorPayload, 'atk' | 'def' | 'step' | 'scale'>;
export type YGOProPayloadArrayKey = Extract<keyof YGOProRequestorPayload, 'card_type' | 'attribute' | 'limit'>;
export type YGOProPayloadListKey = Extract<keyof YGOProRequestorPayload, 'marker' | 'race' | 'st_race' | 'ability' | 'frame'>;
export type YGOProFilterState = {
    status: 'idling' | 'loading' | 'loaded',
    payloadMap: Record<string, YGOProRequestorPayload>,
    sortedCardListMap: Record<OrderType, YGOProCard[]>,
    fullCardMap: Record<string, YGOProCard>,
    activeCardListKey: Record<string, OrderType>,
    activeCardList: Record<string, YGOProCard[] | undefined>,
    init: () => Promise<void>,
    set: (id: string, transformer: (oldPayload: YGOProRequestorPayload) => YGOProRequestorPayload) => void,
    change: <Key extends keyof YGOProRequestorPayload>(id: string, key: Key, value: YGOProRequestorPayload[Key]) => void,
    changeActiveCardList: (id: string, listKey: OrderType) => void,
}
export const useYGOProFilter = create<YGOProFilterState>((set, get) => ({
    status: 'idling',
    payloadMap: {},
    sortedCardListMap: {
        atk: [],
        def: [],
        level: [],
        name: [],
    },
    fullCardMap: {},
    activeCardListKey: {},
    activeCardList: {},

    init: async () => {
        if (get().status !== 'idling') {
            set(state => ({ ...state, status: 'loading' }));
            return;
        };
        const fullCardList = await axios<{ data: YGOProCardResponse[] }>('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
        const processedCardList: YGOProCard[] = fullCardList.data.data
            .filter(entry => entry.frameType !== 'skill')
            .map<YGOProCard>(normalizeYGOProCardResponse);

        /** Tách các sorted list ở đây, vì điều kiện sort là cố định ta có thể presort ở đây */
        const monsterCardList: YGOProCard[] = [];
        const STCardList: YGOProCard[] = [];
        processedCardList.forEach(card => {
            if (card.card_type === 'monster') monsterCardList.push(card);
            else STCardList.push(card);
        });
        const sortedSTList = STCardList.sort((l, r) => l.race_binary - r.race_binary);
        const sortedMonsterListByATK = [...monsterCardList].sort((l, r) => l.question_atk
            ? (r.question_atk ? 0 : 1)
            : (r.question_atk ? -1 : (r.atk ?? -1) - (l.atk ?? -1)));
        const sortedMonsterListByDEF = [...monsterCardList].sort((l, r) => l.question_def
            ? (r.question_def ? 0 : 1)
            : (r.question_def ? -1 : (r.def ?? -1) - (l.def ?? -1)));
        /** Monster sort theo level sẽ được chia làm 3 lớp, sort frame => sort level => sort ATK */
        const monsterLevelCategory: YGOProCard[][][] = [];
        sortedMonsterListByATK.forEach(entry => {
            const { main_frame, step = -1 } = entry;
            /** Một mẹo nhỏ để sort level theo thứ tự giảm dần, ví dụ step là 12 sẽ xếp ở vị trí 20 - 12 = 8, step 10 sẽ xếp ở vị trí 20 - 10 = 10, max step hiện tại là 13 nhưng ta chừa 20 slot cho an toàn */
            const categoryIndex = 20 - step;
            const frameIndex = MonsterMainFrameIndex[main_frame] ?? DefaultMonsterMainFrame;
            if (!monsterLevelCategory[frameIndex]) monsterLevelCategory[frameIndex] = [];
            if (!monsterLevelCategory[frameIndex][categoryIndex]) monsterLevelCategory[frameIndex][categoryIndex] = [];
            monsterLevelCategory[frameIndex][categoryIndex].push(entry);
        });

        const sortedCardListMap: Record<OrderType, YGOProCard[]> = {
            name: processedCardList,
            atk: [...sortedMonsterListByATK, ...sortedSTList],
            def: [...sortedMonsterListByDEF, ...sortedSTList],
            level: Object.values(monsterLevelCategory).flatMap(entry => entry.flat()),
        };

        set(state => {
            return {
                ...state,
                status: 'loaded',
                sortedCardListMap,
                activeCardList: Object.entries(state.activeCardListKey)
                    .map(([id, activeListKey]) => {
                        return { id, list: sortedCardListMap[activeListKey] };
                    })
                    .reduce((acc, cur) => {
                        acc[cur.id] = cur.list;
                        return acc;
                    }, {} as Record<string, YGOProCard[]>),
                fullCardMap: processedCardList.reduce((map, card) => {
                    map[card.id] = card;

                    return map;
                }, {} as Record<string, YGOProCard>),
            };
        });
    },
    set: (id, transformer) => set(state => {
        const newPayload = transformer(state.payloadMap[id]);
        if (isJsonObjectEqual(newPayload, state.payloadMap[id])) return state;
        const newPayloadMap = { ...state.payloadMap, [id]: newPayload };

        return {
            ...state,
            payloadMap: newPayloadMap,
        };
    }),
    change: (id, key, value) => set(state => {
        const newPayload = { ...state.payloadMap, [id]: { ...state.payloadMap[id] } };
        newPayload[id][key] = value;

        return {
            ...state,
            payloadMap: newPayload,
        };
    }),
    changeActiveCardList: (id, listKey) => set(state => {
        return {
            ...state,
            activeCardListKey: { ...state.activeCardListKey, [id]: listKey },
            activeCardList: { ...state.activeCardList, [id]: state.sortedCardListMap[listKey] },
        };
    }),
}));