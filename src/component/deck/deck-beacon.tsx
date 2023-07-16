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
        style={{
            backgroundImage: `url("${process.env.PUBLIC_URL}/asset/img/texture/noise.png")`,
        }}
        data-beacon-visibility={isVisible}
        data-beacon-index={zIndex}
        {...rest}
    />;
});

export type DeckBeacon = {
    deckName: string,
    actionType: BeaconAction,
} & React.HTMLAttributes<HTMLDivElement>;
export const DeckBeacon = React.forwardRef(({
    deckName,
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
            [PROP_BEACON_INFO]: `[ID-${deckName}]-[ACTION-${actionType}]`,
            [PROP_BEACON_DECK_ORIGIN]: deckName,
            [PROP_BEACON_ACTION_TYPE]: actionType,
        }}
    />;
});