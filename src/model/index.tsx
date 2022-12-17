import { Record as ImmutableRecord } from 'immutable';

type BaseCardImage = {
    _id: string,
    name: string,
    type: 'internal' | 'external',
    data: string,
    dataURL: string,
};
export type CardImage = ImmutableRecord<BaseCardImage>;
export const CardImageConverter = ImmutableRecord<BaseCardImage>({
    _id: '',
    name: '',
    type: 'internal',
    data: '',
    dataURL: '',
});

export const DROP_TYPE_DECK = 'DECK';
export const DROP_TYPE_DECK_BEACON = 'DECK_BEACON';
export const DROP_TYPE_DECK_BEACON_LIST = 'DECK_BEACON_LIST';
export const DROP_TYPE_BOARD = 'BOARD';
export const DECK_ROW_COUNT = 7;

export const CLASS_BEACON_DECK_BACK = 'js-beacon-deck-back';
export const CLASS_BOARD_ACTIVE = 'js-deck-board-ready-to-drop';
export const CLASS_BOARD = 'js-board';

export const GetDropTypeRegex = /\[TYPE-(\w*)\]/m;
export const GetDropIDRegex = /\[ID-([\w-]*)\]/m;
export const GetDropActionRegex = /\[ACTION-([\w-]*)\]/m;
export const GetBoardRegex = /\[BOARD-([\w-]*)\]/m;
export const GetOriginRegex = /\[ORIGIN-([\w-]*)\]/m;

export const DragTransformStatRegex = /translate\((-?\d*)px, (-?\d*)px\)/;

export const BeaconAction = Object.freeze({
    top: 'top' as const,
    bottom: 'bottom' as const,
    shuffle: 'shuffle' as const,
});
export type BEACON_ACTION = keyof typeof BeaconAction;
export const BeaconActionLabel: Readonly<Record<BEACON_ACTION, { label: string, shortLabel: string }>> = Object.freeze({
    top: { label: 'To top', shortLabel: 'Top' },
    bottom: { label: 'To bottom', shortLabel: 'Bottom' },
    shuffle: { label: 'Add and shuffle', shortLabel: 'Shuffle' },
});
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

/** Ta không bắt đầu từ 0 vì một vài component dùng index 0 là signal để xử lý vấn đề khác */
export const MIN_CARD_INDEX = 10;
export const MIN_MODAL_INDEX = 610;
export const MIN_ABSOLUTE_INDEX = 620;

export * from './imgur';
export * from './field';