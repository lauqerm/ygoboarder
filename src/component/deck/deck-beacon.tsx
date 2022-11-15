import React from 'react';
import { BEACON_ACTION, DECK_TYPE, DROP_TYPE_DECK_BEACON } from 'src/model';
import './deck-beacon.scss';

export type DeckBeacon = {
    deckId: string,
    actionType: BEACON_ACTION,
    zIndex: number
} & React.HTMLAttributes<HTMLDivElement>;
export const DeckBeacon = ({
    deckId,
    actionType,
    zIndex,
    ...rest
}: DeckBeacon) => {
    return <div className="deck-beacon"
        data-entity-type={DROP_TYPE_DECK_BEACON}
        data-deck-beacon={`[ID-${deckId}]-[ACTION-${actionType}]`}
        data-beacon-index={zIndex}
        {...rest}
    />;
};