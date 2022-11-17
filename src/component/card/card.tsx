import React, { useEffect, useState } from 'react';
import { CardImage } from 'src/model';
import { useCountStore } from 'src/state';
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
    const registerCount = useCountStore(state => state.set);
    const type = image.get('type');
    const imgSource = type === 'external'
        ? image.get('dataURL')
        : type === 'internal'
            ? image.get('data')
            : undefined;
    
    useEffect(() => {
        registerCount(origin, 1);

        return () => {
            registerCount(origin, -1);
        };
    }, []);

    return <div
        className={mergeClass('ygo-card', `ygo-card-size-${size}`)}
    >
        <div>{origin}</div>
        <DelayedImage type={type === 'external' ? 'URL' : 'Base64'} className="card-image" src={imgSource} />
    </div>;
};