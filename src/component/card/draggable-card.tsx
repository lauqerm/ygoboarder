import React from 'react';
import { mergeClass } from 'src/util';
import { Card } from './card';
import styled from 'styled-components';
import './draggable-card.scss';

const DraggableCardContainer = styled.div`
    position: relative;
    border-left: 2px solid transparent;
    border-right: 2px solid transparent;
    padding: var(--spacing-xxs) 0;
    margin: var(--spacing-xxs);
    display: inline-block;
`;

export type DraggableCard = {
    uniqueId: string,
    onDelete?: () => void,
    onDuplicate?: () => void,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const DraggableCard = React.forwardRef<HTMLDivElement, DraggableCard>(({
    uniqueId,
    image,
    size = 'sm',
    onDelete = () => {},
    onDuplicate = () => {},
    className,
    origin,
    ...rest
}: DraggableCard, externalRef) => {
    return <DraggableCardContainer ref={externalRef}
        data-countable-card-id={uniqueId}
        className={mergeClass('ygo-card-wrapper', 'ygo-draggable-card', `ygo-card-size-${size}`, className)}
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
    </DraggableCardContainer>;
});