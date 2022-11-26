import React, { ForwardedRef } from 'react';
import { BEACON_ACTION, DROP_TYPE_DECK_BEACON, DROP_TYPE_DECK_BEACON_LIST } from 'src/model';
import { mergeClass } from 'src/util';
import './deck-beacon.scss';

export type DeckBeaconWrapper = React.HTMLAttributes<HTMLDivElement> & {
    zIndex: number,
    isVisible?: boolean,
};
export const DeckBeaconWrapper = React.forwardRef(({
    isVisible = false,
    zIndex,
    className,
    ...rest
}: DeckBeaconWrapper, ref: ForwardedRef<HTMLDivElement>) => {
    return <div ref={ref}
        className={mergeClass(
            'deck-beacon-wrapper',
            className,
        )}
        data-entity-type={DROP_TYPE_DECK_BEACON_LIST}
        data-beacon-visibility={isVisible}
        data-beacon-index={zIndex}
        {...rest}
    />;
});

export type DeckBeacon = {
    deckId: string,
    actionType: BEACON_ACTION,
} & React.HTMLAttributes<HTMLDivElement>;
export const DeckBeacon = ({
    deckId,
    actionType,
    className,
    ...rest
}: DeckBeacon) => {
    return <div
        className={mergeClass(
            'deck-beacon',
            className,
        )}
        data-entity-type={DROP_TYPE_DECK_BEACON}
        data-deck-origin={deckId}
        data-deck-beacon={`[ID-${deckId}]-[ACTION-${actionType}]`}
        data-beacon-type={actionType}
        {...rest}
    />;
};