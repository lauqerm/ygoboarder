import React from 'react';
import { BEACON_ACTION, DROP_TYPE_DECK_BEACON } from 'src/model';
import { mergeClass } from 'src/util';
import './deck-beacon.scss';

export type DeckBeacon = {
    deckId: string,
    actionType: BEACON_ACTION,
    zIndex: number,
    forceHighlight?: boolean,
} & React.HTMLAttributes<HTMLDivElement>;
export const DeckBeacon = ({
    deckId,
    actionType,
    zIndex,
    forceHighlight,
    className,
    ...rest
}: DeckBeacon) => {
    return <div
        className={mergeClass(
            'deck-beacon',
            forceHighlight ? 'available-to-drop ready-to-drop' : '',
            className,
        )}
        data-entity-type={DROP_TYPE_DECK_BEACON}
        data-deck-origin={deckId}
        data-deck-beacon={`[ID-${deckId}]-[ACTION-${actionType}]`}
        data-beacon-type={actionType}
        data-beacon-index={zIndex}
        {...rest}
    />;
};