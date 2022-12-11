export type FieldComponentKey = keyof typeof FieldComponentKeyMap;
export const FieldComponentKeyMap = Object.freeze({
    deck: 'deck' as const,
    extraDeck: 'extraDeck' as const,
    gy: 'gy' as const,
    banishedPile: 'banishedPile' as const,
    trunk: 'trunk' as const,
});

export type FieldKey = 'your' | 'opponent';
export const FieldKeyMap = Object.freeze({
    your: 'your' as const,
    opponent: 'opponent' as const,
});

export type FieldDeckCoordinateMap = Partial<Record<FieldComponentKey, DOMRect>>;