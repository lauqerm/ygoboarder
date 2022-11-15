import React, { useEffect, useState } from 'react';
import { CardImage, DECK_TYPE } from 'src/model';
import { mergeClass } from 'src/util';
import { DelayedImage } from './card-image';
import './card.scss';

export type Card = {
    image: CardImage,
    size?: 'sm' | 'md' | 'lg',
    origin: string,
}
export const Card = ({
    image,
    size = 'sm',
    origin,
}: Card) => {
    const type = image.get('type');
    const imgSource = type === 'external'
        ? image.get('dataURL')
        : type === 'internal'
            ? image.get('data')
            : undefined;

    return <div
        className={mergeClass('ygo-card', `ygo-card-size-${size}`)}
    >
        <div>{origin}</div>
        <DelayedImage type={type === 'external' ? 'URL' : 'Base64'} className="card-image" src={imgSource} />
    </div>;
};