import React, { ForwardedRef } from 'react';
import {
    BeaconAction,
    BEACON_CLASS,
    CLASS_BEACON_WRAPPER,
    PROP_BEACON_ACTION_TYPE,
    PROP_BEACON_DECK_ORIGIN,
    PROP_BEACON_INFO,
} from 'src/model';
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
            CLASS_BEACON_WRAPPER,
            className,
        )}
        data-beacon-visibility={isVisible}
        data-beacon-index={zIndex}
        {...rest}
    />;
});

export type DeckBeacon = {
    deckId: string,
    actionType: BeaconAction,
} & React.HTMLAttributes<HTMLDivElement>;
export const DeckBeacon = React.forwardRef(({
    deckId,
    actionType,
    className,
    ...rest
}: DeckBeacon, ref: React.ForwardedRef<HTMLDivElement>) => {
    return <div ref={ref}
        className={mergeClass(
            'deck-beacon',
            BEACON_CLASS,
            className,
        )}
        {...rest}
        {...{
            [PROP_BEACON_INFO]: `[ID-${deckId}]-[ACTION-${actionType}]`,
            [PROP_BEACON_DECK_ORIGIN]: deckId,
            [PROP_BEACON_ACTION_TYPE]: actionType,
        }}
    />;
});