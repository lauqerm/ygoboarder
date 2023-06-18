import { Player } from './game';

export const DeckType = Object.freeze({
    /** Ví dụ Trunk
    */
    permanent: 'permanent' as const,

    /** Ví dụ GY và Banished Pile
    */
    transient: 'transient' as const,

    /** Ví dụ Deck và Extra Deck
     */
    consistent: 'consistent' as const,

    /** Ví dụ Token Pile
     */
    none: 'none' as const,
});
export type DeckType = keyof typeof DeckType;

export const CardPreset = Player;
export type CardPreset = keyof typeof CardPreset;