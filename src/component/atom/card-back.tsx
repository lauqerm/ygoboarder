import { CardPreset } from 'src/model';
import styled from 'styled-components';
import { mergeClass } from 'src/util';

const CardBackImage = styled.img<{ $size?: 'sm' | 'lg' | 'md' }>`
    ${props => props.$size
        ? `
            width: var(--card-width-${props.$size});
            height: var(--card-height-${props.$size});
        `
        : `
            width: var(--card-width);
            height: var(--card-height);
        `}
    user-select: none;
    &.card-back-flashing {
        animation: fade-cycle 4s infinite;
    }
`;

export type CardBack = {
    size?: 'sm' | 'lg' | 'md',
    preset?: CardPreset,
    flashing?: boolean,
} & React.HTMLAttributes<HTMLImageElement>;
export const CardBack = ({
    size = 'sm',
    preset,
    flashing,
    className,
    ...rest
}: CardBack) => {
    return <CardBackImage
        $size={size}
        src={`/asset/img/ygo-card-back-${preset ?? 'grey'}.png`}
        alt="card-back"
        {...rest}
        className={mergeClass('card-back', flashing ? 'card-back-flashing' : '', className)}
    />;
};