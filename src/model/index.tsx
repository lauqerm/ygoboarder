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
export const DECK_COL_COUNT = 7;
export const DECK_ROW_COUNT = 4;

export const CLASS_BEACON_WRAPPER = 'js-deck-beacon-wrapper';
export const CLASS_BEACON_DECK_BACK = 'js-beacon-deck-back';
export const CLASS_BOARD_ACTIVE = 'js-deck-board-js-ready-to-drop';
export const CLASS_BOARD = 'js-board';
export const CLASS_CARD_MOVABLE = 'js-movable-card';
export const CLASS_CARD_MOVABLE_ZONED = 'js-movable-card-zoned';

export const GetDropTypeRegex = /\[TYPE-(\w*)\]/m;
export const GetDropIDRegex = /\[ID-([\w-]*)\]/m;
export const GetDropActionRegex = /\[ACTION-([\w-]*)\]/m;
export const GetBoardRegex = /\[BOARD-([\w-]*)\]/m;
export const GetDeckButtonRegex = /\[DECKBUTTON-([\w-]*)\]/m;
export const GetDeckModalRegex = /\[DECKMODAL-([\w-]*)\]/m;
export const GetOriginRegex = /\[ORIGIN-([\w-]*)\]/m;

export const DragTransformStatRegex = /translate\((-?\d*)px, (-?\d*)px\)/;

export const PROP_DOM_ENTITY_NAME = 'data-dom-entity-name';
export const PROP_DOM_ENTITY_TYPE = 'data-dom-entity-type';
export const PropDOMEntityVisible = 'data-dom-entity-visible';
export const DOMEntityType = {
    board: 'board' as const,
    deckButton: 'deckButton' as const,
    deckModal: 'deckModal' as const,
};
export type DOMEntityType = keyof typeof DOMEntityType;
export const DOM_ENTITY_CLASS = 'js-dom-entity';
export const DOMEntityTypeClass = {
    board: 'js-dom-entity-board' as const,
    deckButton: 'js-dom-entity-deckButton' as const,
    deckModal: 'js-dom-entity-deckModal' as const,
};

export const MODAL_WRAPPER_ID = 'modal-wrapper';

/** Ta không bắt đầu từ 0 vì một vài component dùng index 0 là signal để xử lý vấn đề khác */
export const MIN_CARD_INDEX = 10;
export const MIN_MODAL_INDEX = 610;
export const MIN_ABSOLUTE_INDEX = 650;

export * from './imgur';
export * from './field';
export * from './deck';
export * from './card';