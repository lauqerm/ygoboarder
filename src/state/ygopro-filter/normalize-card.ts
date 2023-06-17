import {
    CardPoolToBitMap,
    CardRaceToBitMap,
    LimitToNumberMap,
    MarkerToBitMap,
    MonsterAbilityImplicationMap,
    MonsterAbilitySubtypeToBitMap,
    MonsterFrameToBitMap,
    YGOProCard,
    YGOProCardResponse,
} from 'src/model';

export const normalizeYGOProCardResponse = (entry: YGOProCardResponse): YGOProCard => {
    const {
        name, desc,
        type,
        level, linkval, frameType, linkmarkers, race, misc_info, banlist_info,
    } = entry;
    const { ban_ocg, ban_tcg } = banlist_info ?? {};
    const { formats, has_effect, question_atk, question_def } = (misc_info ?? [])[0];
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
    const main_frame = frameType.replaceAll('_pendulum', '');

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
        main_frame,
        limit_info: {
            tcg: ban_tcg ? LimitToNumberMap[ban_tcg] : 3,
            ocg: ban_ocg ? LimitToNumberMap[ban_ocg] : 3,
        },
        is_pendulum: frameType.includes('pendulum'),
        step: level ?? linkval,
        filterable_name: name.toLowerCase(),
        filterable_card_eff: cardEff.toLowerCase(),
        filterable_pend_eff: pendEff.toLowerCase(),
        question_atk: question_atk === 1 ? true : false,
        question_def: question_def === 1 ? true : false,
        card_type: frameType === 'spell'
            ? 'spell'
            : frameType === 'trap'
                ? 'trap'
                : 'monster',
    };
};