import { PhaseBehavior } from 'src/state';
import { PhaseType } from './card';
import { CardPreset, DeckType } from './deck';

export const PROP_BEACON_DECK_ORIGIN = 'data-beacon-deck-origin';
export const PROP_BEACON_ACTION_TYPE = 'data-beacon-action-type';
export const PROP_BEACON_INFO = 'data-beacon-info';
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

export type BoardComponentAction = 'view' | 'shuffle'
| 'excavate-top-faceup'
| 'get-top'
| 'get-random' | 'get-random-faceup' | 'get-random-facedown';
export type ActionListPlacement = 'left' | 'right';
export type BoardComponent = {
    fieldKey: FieldKey,
    fieldComponentKey: FieldComponentKey,
    type: DeckType,
    preset: CardPreset,
    name: string,
    displayName: string,
    beaconList: BeaconAction[],
    actionPlacement: ActionListPlacement,
    action: BoardComponentAction[],
    defaultPhase: PhaseType,
    phaseBehavior: PhaseBehavior,
};
export const BoardMapping: {
    fieldList: FieldKey[],
    fieldMap: Record<FieldKey, {
        key: FieldKey,
        componentList: FieldComponentKey[],
        componentMap: Record<FieldComponentKey, BoardComponent>
    }>
} = {
    fieldList: [FieldKey.your, FieldKey.opponent],
    fieldMap: {
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
                    fieldKey: FieldKey.your,
                    fieldComponentKey: FieldComponentKey.deck,
                    type: DeckType['permanent'],
                    preset: CardPreset['your'],
                    displayName: 'Your Deck',
                    name: 'YOUR-DECK',
                    beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
                    action: ['view', 'get-top', 'excavate-top-faceup', 'shuffle'],
                    actionPlacement: 'left',
                    defaultPhase: 'down',
                    phaseBehavior: 'always-down',
                },
                [FieldComponentKey.extraDeck]: {
                    fieldKey: FieldKey.your,
                    fieldComponentKey: FieldComponentKey.extraDeck,
                    type: DeckType['permanent'],
                    preset: CardPreset['your'],
                    displayName: 'Your Extra Deck',
                    name: 'YOUR-EXTRA-DECK',
                    beaconList: [BeaconAction['top'], BeaconAction['shuffle']],
                    action: ['view', 'get-random-faceup', 'get-random-facedown'],
                    actionPlacement: 'right',
                    defaultPhase: 'down',
                    phaseBehavior: 'keep',
                },
                [FieldComponentKey.trunk]: {
                    fieldKey: FieldKey.your,
                    fieldComponentKey: FieldComponentKey.trunk,
                    type: DeckType['consistent'],
                    preset: CardPreset['your'],
                    displayName: 'Your Trunk',
                    name: 'YOUR-TRUNK',
                    beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
                    action: ['view', 'shuffle'],
                    actionPlacement: 'right',
                    defaultPhase: 'up',
                    phaseBehavior: 'always-up',
                },
                [FieldComponentKey.gy]: {
                    fieldKey: FieldKey.your,
                    fieldComponentKey: FieldComponentKey.gy,
                    type: DeckType['transient'],
                    preset: CardPreset['your'],
                    displayName: 'Your GY',
                    name: 'YOUR-GY',
                    beaconList: [BeaconAction['top'], BeaconAction['bottom']],
                    action: ['view', 'excavate-top-faceup'],
                    actionPlacement: 'left',
                    defaultPhase: 'up',
                    phaseBehavior: 'always-up',
                },
                [FieldComponentKey.banishedPile]: {
                    fieldKey: FieldKey.your,
                    fieldComponentKey: FieldComponentKey.banishedPile,
                    type: DeckType['transient'],
                    preset: CardPreset['your'],
                    displayName: 'Your Banished Pile',
                    name: 'YOUR-BANISHED-PILE',
                    beaconList: [BeaconAction['top'], BeaconAction['bottom']],
                    action: ['view', 'excavate-top-faceup'],
                    actionPlacement: 'left',
                    defaultPhase: 'up',
                    phaseBehavior: 'keep',
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
                    fieldKey: FieldKey.opponent,
                    fieldComponentKey: FieldComponentKey.deck,
                    preset: CardPreset['opp'],
                    type: DeckType['permanent'],
                    displayName: 'Opponent\'s Deck',
                    name: 'OP-DECK',
                    beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
                    action: ['view', 'get-top', 'excavate-top-faceup', 'shuffle'],
                    actionPlacement: 'right',
                    defaultPhase: 'down',
                    phaseBehavior: 'always-down',
                },
                [FieldComponentKey.extraDeck]: {
                    fieldKey: FieldKey.opponent,
                    fieldComponentKey: FieldComponentKey.extraDeck,
                    preset: CardPreset['opp'],
                    type: DeckType['permanent'],
                    displayName: 'Opponent\'s Extra Deck',
                    name: 'OP-EXTRA-DECK',
                    beaconList: [BeaconAction['top'], BeaconAction['shuffle']],
                    action: ['view', 'get-random-faceup', 'get-random-facedown'],
                    actionPlacement: 'left',
                    defaultPhase: 'down',
                    phaseBehavior: 'keep',
                },
                [FieldComponentKey.trunk]: {
                    fieldKey: FieldKey.opponent,
                    fieldComponentKey: FieldComponentKey.trunk,
                    preset: CardPreset['opp'],
                    type: DeckType['consistent'],
                    displayName: 'Opponent\'s Trunk',
                    name: 'OP-TRUNK',
                    beaconList: [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
                    action: ['view', 'shuffle'],
                    actionPlacement: 'left',
                    defaultPhase: 'up',
                    phaseBehavior: 'always-up',
                },
                [FieldComponentKey.gy]: {
                    fieldKey: FieldKey.opponent,
                    fieldComponentKey: FieldComponentKey.gy,
                    preset: CardPreset['opp'],
                    type: DeckType['transient'],
                    displayName: 'Opponent\'s GY',
                    name: 'OP-GY',
                    beaconList: [BeaconAction['top'], BeaconAction['bottom']],
                    action: ['view', 'excavate-top-faceup'],
                    actionPlacement: 'right',
                    defaultPhase: 'up',
                    phaseBehavior: 'always-up',
                },
                [FieldComponentKey.banishedPile]: {
                    fieldKey: FieldKey.opponent,
                    fieldComponentKey: FieldComponentKey.banishedPile,
                    preset: CardPreset['opp'],
                    type: DeckType['transient'],
                    displayName: 'Opponent\'s Banished Pile',
                    name: 'OP-BANISHED-PILE',
                    beaconList: [BeaconAction['top'], BeaconAction['bottom']],
                    action: ['view', 'excavate-top-faceup'],
                    actionPlacement: 'right',
                    defaultPhase: 'up',
                    phaseBehavior: 'keep',
                },
            },
        },
    },
};

export const getBoardComponent = (fieldKey: FieldKey, fieldComponentKey: FieldComponentKey) => {
    return BoardMapping.fieldMap[fieldKey].componentMap[fieldComponentKey];
};
export const BoardComponentList = Object
    .values(BoardMapping.fieldMap)
    .reduce((prev, curr) => {
        const { componentList, componentMap } = curr;

        return [
            ...prev,
            ...componentList.map(componentKey => componentMap[componentKey]),
        ];
    }, [] as BoardComponent[]);