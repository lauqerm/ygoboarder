import React from 'react';
import { mergeClass } from 'src/util';
import { Card } from './card';
import styled from 'styled-components';
import './draggable-card.scss';

const DraggableCardContainer = styled.div`
    position: relative;
    display: inline-block;
`;

export type DraggableCard = {
    uniqueId: string,
    isDragging: boolean,
    onDelete?: () => void,
    onDuplicate?: () => void,
    dragRef: (element?: HTMLElement | null | undefined) => any,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const DraggableCard = ({
    uniqueId,
    isDragging,
    image,
    size = 'sm',
    onDelete = () => {},
    onDuplicate = () => {},
    className,
    origin,
    dragRef,
    ...rest
}: DraggableCard) => {
    return <DraggableCardContainer ref={dragRef}
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
};