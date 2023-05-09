export const DeckType = Object.freeze({
    /** Ví dụ Trunk
     * * Move ra board: Mất origin (có cảnh báo) - Tạo copy
     * * Move vào permanent: Đổi origin
     * * Move vào consistent: Đổi origin - Tạo copy
     * * Move vào transient: Mất origin (có cảnh báo) - Tạo copy
    */
    permanent: 'permanent' as const,
    /** Ví dụ GY và Banished Pile
     * * Move ra board: Giữ origin
     * * Move vào permanent: Đổi origin
     * * Move vào consistent: Đổi origin
     * * Move vào transient: Giữ origin
    */
    transient: 'transient' as const,
    /** Ví dụ Deck và Extra Deck
     * * Move ra board: Giữ origin
     * * Move vào permanent: Đổi origin
     * * Move vào consistent: Đổi origin
     * * Move vào transient: Giữ origin
     */
    consistent: 'consistent' as const,
    none: 'none' as const,
});
export type DeckType = keyof typeof DeckType;

export const CardPreset = Object.freeze({
    your: 'your' as const,
    opp: 'opp' as const,
    
});
export type CardPreset = keyof typeof CardPreset;