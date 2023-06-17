export const getDefaultCardSet = () => ({
    set_code: '',
    set_name: '',
    set_price: '',
    set_rarity: '',
    set_rarity_code: '',
});
export type CardSet = ReturnType<typeof getDefaultCardSet>;

export const getDefaultCardPrize = () => ({
    amazon_price: '',
    cardmarket_price: '',
    coolstuffinc_price: '',
    ebay_price: '',
    tcgplayer_price: '',
});
export type CardPrize = ReturnType<typeof getDefaultCardPrize>;

export const getDefaultCardURLImage = () => ({
    id: 0,
    image_url: '',
    image_url_cropped: '',
    image_url_small: '',
});
export type CardURLImage = ReturnType<typeof getDefaultCardURLImage>;

export const getDefaultCardMiscInfo = () => ({
    downvotes: 0,
    formats: [] as string[],
    has_effect: 0,
    konami_id: 0,
    ocg_date: '',
    tcg_date: '',
    upvotes: 0,
    views: 0,
    viewsweek: 0,
    question_atk: 0,
    question_def: 0,
});
export type CardMiscInfo = ReturnType<typeof getDefaultCardMiscInfo>;

export type LimitStatus = keyof typeof LimitToNumberMap;
export const LimitToNumberMap = {
    'Semi-Limited': 2,
    'Limited': 1,
    'Banned': 0,
    'Unlimited': 3,
};
export const getDefaultBanlistInfo = () => ({
    ban_tcg: 'Unlimited' as LimitStatus,
    ban_ocg: 'Unlimited' as LimitStatus,
    ban_goat: 'Unlimited' as LimitStatus,
});
export type BanlistInfo = ReturnType<typeof getDefaultBanlistInfo>;

export const getDefaultYGOProCardResponse = () => ({
    atk: 0 as number | undefined,
    attribute: '' as string | undefined,
    card_images: [] as CardURLImage[],
    card_prices: [] as CardPrize[],
    card_sets: [] as CardSet[],
    def: 0 as number | undefined,
    desc: '',
    frameType: '',
    id: 0,
    level: 0 as number | undefined,
    linkmarkers: undefined as string[] | undefined,
    linkval: 0 as number | undefined,
    name: '',
    race: '' as string | undefined,
    scale: 0 as number | undefined,
    type: '',
    banlist_info: getDefaultBanlistInfo() as BanlistInfo | undefined,
    misc_info: [] as CardMiscInfo[] | undefined,
});
export type YGOProCardResponse = ReturnType<typeof getDefaultYGOProCardResponse>;

export type CardType = (typeof CardTypeList)[0];
export const CardTypeList = ['monster' as const, 'spell' as const, 'trap' as const];

export const MarkerToBitMap: Record<string, number> = {
    'Top-Left': 2 ** 0,
    'Top': 2 ** 1,
    'Top-Right': 2 ** 2,
    'Left': 2 ** 3,
    'Right': 2 ** 4,
    'Bottom-Left': 2 ** 5,
    'Bottom': 2 ** 6,
    'Bottom-Right': 2 ** 7,
};
export const BitToMarkerMap: Record<string, string> = {
    [`${2 ** 0}`]: 'Top-Left',
    [`${2 ** 1}`]: 'Top',
    [`${2 ** 2}`]: 'Top-Right',
    [`${2 ** 3}`]: 'Left',
    [`${2 ** 4}`]: 'Right',
    [`${2 ** 5}`]: 'Bottom-Left',
    [`${2 ** 6}`]: 'Bottom',
    [`${2 ** 7}`]: 'Bottom-Right',
};

export const CardPoolToBitMap: Record<string, number> = {
    'TCG': 2 ** 0,
    'OCG': 2 ** 1,
    'BOTH': 2 ** 2,
};
export const CardBitToLabelMap: Record<string, string> = {
    [`${2 ** 0}`]: 'TCG',
    [`${2 ** 1}`]: 'OCG',
    [`${2 ** 2}`]: '',
};

export const getDefaultYGOProCard = () => ({
    ...getDefaultYGOProCardResponse(),
    /** main_frame là frame chính của card, ví dụ Amorphage Wrath có frame chính là effect, frame thật là effect_pendulum */
    main_frame: '',
    /** level, rank, link rating */
    step: 0 as number | undefined,
    card_type: 'monster' as CardType,
    filterable_name: '',
    filterable_card_eff: '',
    filterable_pend_eff: '',
    question_atk: false,
    question_def: false,
    is_pendulum: false,
    /** link marker được chuyển hóa thành dạng binary để kiểm tra nhanh */
    link_binary: 0,
    /** race được chuyển hóa thành dạng binary để kiểm tra nhanh */
    race_binary: 0,
    /** card pool (TCG only, OCG only, both) được chuyển hóa thành dạng binary để kiểm tra nhanh */
    pool_binary: 0,
    /** ability (toon, tuner, etc...) được chuyển hóa thành dạng binary để kiểm tra nhanh */
    ability_binary: 0,
    /** monster frame (xyz, fusion, etc...) được chuyển hóa thành dạng binary để kiểm tra nhanh */
    frame_binary: 0,
    limit_info: {
        ocg: 3,
        tcg: 3,
    },
});
export type YGOProCard = ReturnType<typeof getDefaultYGOProCard>;

export const ygoproCardToDescription = (card: YGOProCardResponse) => {
    const {
        name,
        atk, def,
        level, frameType,
        linkval, linkmarkers,
        attribute,
        race,
        type,
        desc,
        misc_info,
    } = card;
    const { question_atk, question_def } = misc_info?.[0] ?? {};
    const isMonster = type.toLowerCase().includes('monster')
        || type.toLowerCase().includes('token');
    const isXyzMonster = frameType === 'xyz';
    const isLinkMonster = frameType === 'link';
    const rating = isXyzMonster
        ? `RANK ${level}`
        : isLinkMonster
            ? `LINK ${linkval}`
            : isMonster
                ? `LEVEL ${level}`
                : null;
    const stat = isMonster
        ? `ATK: ${question_atk === 1 ? '?' : atk}${isLinkMonster ? '' : ` / DEF: ${question_def === 1 ? '?' : def}`}`
        : undefined;
    const category = `${race} ${type}`;
    const normalizedLinkMarkerList = Array.isArray(linkmarkers)
        ? linkmarkers.join(', ')
        : linkmarkers;

    return `${name}
${[rating, attribute, category].filter(Boolean).join(' ')}
${[stat, normalizedLinkMarkerList].filter(Boolean).join(' ')}
${desc}
    `;
};