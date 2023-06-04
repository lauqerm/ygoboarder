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

export type LimitStatus = 'Semi-Limited' | 'Limited' | 'Banned' | 'Unlimited';
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
    banlist_info: getDefaultBanlistInfo() as BanlistInfo,
});
export type YGOProCardResponse = ReturnType<typeof getDefaultYGOProCardResponse>;

export type CardType = (typeof CardTypeList)[0];
export const CardTypeList = ['monster' as const, 'spell' as const, 'trap' as const];
export const getDefaultYGOProCard = () => ({
    ...getDefaultYGOProCardResponse(),
    /** level, rank, link rating */
    step: 0 as number | undefined,
    card_type: 'monster' as CardType,
    filterable_name: '',
    filterable_card_eff: '',
    filterable_pend_eff: '',
    is_pendulum: false,
});
export type YGOProCard = ReturnType<typeof getDefaultYGOProCard>;