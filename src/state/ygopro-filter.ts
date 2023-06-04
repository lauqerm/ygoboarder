import axios from 'axios';
import { YGOProCard, YGOProCardResponse } from 'src/model';
import create from 'zustand';

export type YGOProStatPayload = {
    firstOperator: string | undefined;
    secondOperator: string | undefined;
    firstValue: number | undefined;
    secondValue: number | undefined;
}
export type YGOProRequestorPayload = {
    name?: string,
    desc?: string,
    pendDesc?: string,
    atk?: YGOProStatPayload,
    def?: YGOProStatPayload,
    step?: YGOProStatPayload,
    scale?: YGOProStatPayload,
    card_type?: string[],
};
export type YGOProPayloadStringKey = Extract<keyof YGOProRequestorPayload, 'name' | 'desc' | 'pendDesc'>;
export type YGOProPayloadStatKey = Extract<keyof YGOProRequestorPayload, 'atk' | 'def' | 'step' | 'scale'>;
export type YGOProPayloadArrayKey = Extract<keyof YGOProRequestorPayload, 'card_type'>;
export type YGOProFilterState = {
    status: 'idling' | 'loading' | 'loaded',
    payloadMap: Record<string, YGOProRequestorPayload>,
    fullCardMap: Record<string, YGOProCard>,
    fullCardList: YGOProCard[],
    init: () => Promise<void>,
    set: (id: string, transformer: (oldPayload: YGOProRequestorPayload) => YGOProRequestorPayload) => void,
    change: <Key extends keyof YGOProRequestorPayload>(id: string, key: Key, value: YGOProRequestorPayload[Key]) => void,
}
export const useYGOProFilter = create<YGOProFilterState>((set, get) => ({
    status: 'idling',
    payloadMap: {},
    fullCardMap: {},
    fullCardList: [],

    init: async () => {
        if (get().status !== 'idling') {
            set(state => ({ ...state, status: 'loading' }));
            return;
        };
        const fullCardList = await axios<{ data: YGOProCardResponse[] }>('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        const processedCardList: YGOProCard[] = fullCardList.data.data
            .filter(entry => entry.frameType !== 'skill' && entry.frameType !== 'token')
            .map<YGOProCard>(entry => {
                const { name, desc, level, linkval, frameType } = entry;
                const pendulumAnalyzeResult = /\[\s*pendulum\s*effect\s*\]([\w\W]*)\[\s*(?:monster\s*effect|flavor\s*text)\s*\]([\w\W]*)/gi.exec(desc);
                let cardEff = '', pendEff = '';
                if (pendulumAnalyzeResult) {
                    pendEff = pendulumAnalyzeResult[1];
                    cardEff = pendulumAnalyzeResult[2];
                } else {
                    cardEff = desc;
                }

                return {
                    ...entry,
                    is_pendulum: frameType.includes('pendulum'),
                    step: level ?? linkval,
                    filterable_name: name.toLowerCase(),
                    filterable_card_eff: cardEff.toLowerCase(),
                    filterable_pend_eff: pendEff.toLowerCase(),
                    card_type: frameType === 'spell'
                        ? 'spell'
                        : frameType === 'trap'
                            ? 'trap'
                            : 'monster',
                };
            });

        set(state => {
            return {
                ...state,
                status: 'loaded',
                fullCardList: processedCardList,
                fullCardMap: processedCardList.reduce((map, card) => {
                    map[card.id] = card;

                    return map;
                }, {} as Record<string, YGOProCard>),
            };
        });
    },
    set: (id, transformer) => set(state => {
        const newPayloadMap = { ...state.payloadMap, [id]: transformer(state.payloadMap[id]) };

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
}));