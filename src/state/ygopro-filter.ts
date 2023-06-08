import axios from 'axios';
import {
    CardPoolToBitMap,
    CardRaceToBitMap,
    LimitToNumberMap,
    MarkerToBitMap,
    MonsterAbilityImplicationMap,
    MonsterAbilitySubtypeToBitMap,
    MonsterFrameToBitMap,
    PickerMode,
    YGOProCard,
    YGOProCardResponse,
} from 'src/model';
import create from 'zustand';

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
        const fullCardList = await axios<{ data: YGOProCardResponse[] }>('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
        const processedCardList: YGOProCard[] = fullCardList.data.data
            .filter(entry => entry.frameType !== 'skill' && entry.frameType !== 'token')
            .map<YGOProCard>(entry => {
                const {
                    name, desc,
                    type,
                    level, linkval, frameType, linkmarkers, race, misc_info, banlist_info,
                } = entry;
                const { ban_ocg, ban_tcg } = banlist_info ?? {};
                const { formats, has_effect } = (misc_info ?? [])[0];
                const pendulumAnalyzeResult = /\[\s*pendulum\s*effect\s*\]([\w\W]*)\[\s*(?:monster\s*effect|flavor\s*text)\s*\]([\w\W]*)/gi.exec(desc);
                let cardEff = '', pendEff = '';
                if (pendulumAnalyzeResult) {
                    pendEff = pendulumAnalyzeResult[1];
                    cardEff = pendulumAnalyzeResult[2];
                } else {
                    cardEff = desc;
                }
                const link_binary = (linkmarkers ?? []).reduce((acc, markerName) => acc | (MarkerToBitMap[markerName] ?? 0), 0);
                const race_binary = race ? CardRaceToBitMap[race] : 0;
                const ability_binary = (has_effect === 1 ? MonsterAbilitySubtypeToBitMap['Effect'] : 0)
                    | (cardEff.startsWith('Cannot be Normal Summoned/Set.') ? MonsterAbilitySubtypeToBitMap['Special Summon'] : 0)
                    | (type ?? '')
                        .split(' ')
                        .reduce(
                            (acc, abilityOrSubtype) => acc
                                | (MonsterAbilitySubtypeToBitMap[abilityOrSubtype] ?? 0)
                                | (MonsterAbilityImplicationMap[abilityOrSubtype] ?? 0),
                            0,
                        );
                const frame_binary = (type ?? '')
                    .split(' ')
                    .reduce(
                        (acc, abilityOrSubtype) => acc | (MonsterFrameToBitMap[abilityOrSubtype] ?? 0),
                        0,
                    );


                const normalizedFormatList = formats ?? [];
                const pool_binary = normalizedFormatList.includes('OCG')
                    ? normalizedFormatList.includes('TCG')
                        ? CardPoolToBitMap['BOTH']
                        : CardPoolToBitMap['OCG']
                    : CardPoolToBitMap['TCG'];

                return {
                    ...entry,
                    ability_binary,
                    link_binary,
                    race_binary,
                    pool_binary,
                    frame_binary,
                    limit_info: {
                        tcg: ban_tcg ? LimitToNumberMap[ban_tcg] : 3,
                        ocg: ban_ocg ? LimitToNumberMap[ban_ocg] : 3,
                    },
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