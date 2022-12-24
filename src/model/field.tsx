import { CardPreset, DeckType } from './deck';

export const PROP_BEACON_DECK_ORIGIN = 'data-beacon-deck-origin';
export const PROP_BEACON_ACTION_TYPE = 'data-beacon-action-type';
export const BEACON_CLASS = 'js-beacon';
export const BeaconAction = Object.freeze({
    top: 'top' as const,
    bottom: 'bottom' as const,
    shuffle: 'shuffle' as const,
});
export type BeaconAction = keyof typeof BeaconAction;
export const BeaconActionLabel: Readonly<Record<BeaconAction, { label: string, shortLabel: string }>> = Object.freeze({
    top: { label: 'To top', shortLabel: 'Top' },
    bottom: { label: 'To bottom', shortLabel: 'Bottom' },
    shuffle: { label: 'Add and shuffle', shortLabel: 'Shuffle' },
});
export const BOARD_INDEX = 1;
export const DECK_BUTTON_INDEX = 2;

export type FieldComponentKey = keyof typeof FieldComponentKey;
export const FieldComponentKey = Object.freeze({
    deck: 'deck' as const,
    extraDeck: 'extraDeck' as const,
    gy: 'gy' as const,
    banishedPile: 'banishedPile' as const,
    trunk: 'trunk' as const,
});

export type FieldKey = 'your' | 'opponent';
export const FieldKey = Object.freeze({
    your: 'your' as const,
    opponent: 'opponent' as const,
});

export type FieldDeckCoordinateMap = Partial<Record<FieldComponentKey, DOMRect>>;

export const BoardMapping: {
    fieldList: FieldKey[],
} & Record<FieldKey, {
    key: FieldKey,
    componentList: FieldComponentKey[],
    componentMap: Record<FieldComponentKey, {
        deckType: FieldComponentKey,
        type: DeckType,
        preset: CardPreset,
        name: string,
        displayName: string,
        beaconList: BeaconAction[],
    }>
}> = {
    fieldList: [FieldKey.your, FieldKey.opponent],
    [FieldKey.your]: {
        key: FieldKey.your,
        componentList: [
            FieldComponentKey.deck,
            FieldComponentKey.extraDeck,
            FieldComponentKey.gy,
            FieldComponentKey.banishedPile,
            FieldComponentKey.trunk,
        ],
        componentMap: {
            [FieldComponentKey.deck]: {
                deckType: FieldComponentKey.deck,
                type: DeckType['permanent'],
                preset: CardPreset['opp'],
                displayName: 'Your Deck',
                name: 'YOUR-DECK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
            },
            [FieldComponentKey.extraDeck]: {
                deckType: FieldComponentKey.extraDeck,
                type: DeckType['permanent'],
                preset: CardPreset['opp'],
                displayName: 'Your Extra Deck',
                name: 'YOUR-EXTRA-DECK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle']],
            },
            [FieldComponentKey.trunk]: {
                deckType: FieldComponentKey.trunk,
                type: DeckType['consistent'],
                preset: CardPreset['opp'],
                displayName: 'Your Trunk',
                name: 'YOUR-TRUNK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
            },
            [FieldComponentKey.gy]: {
                deckType: FieldComponentKey.gy,
                type: DeckType['transient'],
                preset: CardPreset['opp'],
                displayName: 'Your GY',
                name: 'YOUR-GY',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
            [FieldComponentKey.banishedPile]: {
                deckType: FieldComponentKey.banishedPile,
                type: DeckType['transient'],
                preset: CardPreset['opp'],
                displayName: 'Your Banished Pile',
                name: 'YOUR-BANISHED-PILE',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
        },
    },
    [FieldKey.opponent]: {
        key: FieldKey.opponent,
        componentList: [
            FieldComponentKey.deck,
            FieldComponentKey.extraDeck,
            FieldComponentKey.gy,
            FieldComponentKey.banishedPile,
            FieldComponentKey.trunk,
        ],
        componentMap: {
            [FieldComponentKey.deck]: {
                deckType: FieldComponentKey.deck,
                preset: CardPreset['opp'],
                type: DeckType['permanent'],
                displayName: 'Opponent\'s Deck',
                name: 'OP-DECK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
            },
            [FieldComponentKey.extraDeck]: {
                deckType: FieldComponentKey.extraDeck,
                preset: CardPreset['opp'],
                type: DeckType['permanent'],
                displayName: 'Opponent\'s Extra Deck',
                name: 'OP-EXTRA-DECK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle']],
            },
            [FieldComponentKey.trunk]: {
                deckType: FieldComponentKey.trunk,
                preset: CardPreset['opp'],
                type: DeckType['consistent'],
                displayName: 'Opponent\'s Trunk',
                name: 'OP-TRUNK',
                beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
            },
            [FieldComponentKey.gy]: {
                deckType: FieldComponentKey.gy,
                preset: CardPreset['opp'],
                type: DeckType['transient'],
                displayName: 'Opponent\'s GY',
                name: 'OP-GY',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
            [FieldComponentKey.banishedPile]: {
                deckType: FieldComponentKey.banishedPile,
                preset: CardPreset['opp'],
                type: DeckType['transient'],
                displayName: 'Opponent\'s Banished Pile',
                name: 'OP-BANISHED-PILE',
                beaconList: [BeaconAction['top'], BeaconAction['bottom']],
            },
        },
    },
};