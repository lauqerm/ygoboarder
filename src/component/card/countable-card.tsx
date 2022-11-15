import React from 'react';
import { CardImage } from 'src/model';
import { mergeClass } from 'src/util';
import { Card } from './card';
import './countable-card.scss';

export type CountableCard = {
    uniqueId: string,
    onDelete?: () => void,
    onDuplicate?: () => void,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const CountableCard = React.forwardRef<HTMLDivElement, CountableCard>(({
    uniqueId,
    image,
    size = 'sm',
    onDelete = () => {},
    onDuplicate = () => {},
    className,
    origin,
    ...rest
}: CountableCard, ref) => {
    return <div ref={ref}
        data-countable-card-id={uniqueId}
        className={mergeClass('ygo-card', 'ygo-countable-card', `ygo-card-size-${size}`, className)}
        {...rest}
        onContextMenu={e => {
            e.preventDefault();
            onDelete();
            return false;
        }}
        onDoubleClick={() => {
            onDuplicate();
            return false;
        }}
    >
        <Card image={image} origin={origin} />
    </div>;
});