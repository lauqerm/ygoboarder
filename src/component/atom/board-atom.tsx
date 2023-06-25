import { FieldComponentKey, NeutalFieldComponentKey } from 'src/model';
import {
    DeckIcon,
    ExtraDeckIcon,
    TrunkIcon,
    GraveyardIcon,
    BanishedIcon,
    TokenIcon,
} from './board-icon';
import styled from 'styled-components';

const BoardIconContainer = styled.div<{ $size?: 'sm' | 'lg' | 'md' }>`
    ${props => `
        width: var(--card-width-${props.$size});
        height: var(--card-height-${props.$size});
    `}
    display: flex;
    pointer-events: all;
    svg {
        margin: auto;
        color: #fafafa;
        width: 50%;
    }
`;

const BoardIconMap: Record<FieldComponentKey | NeutalFieldComponentKey, any> = {
    'deck': DeckIcon,
    'extraDeck': ExtraDeckIcon,
    'gy': GraveyardIcon,
    'banishedPile': BanishedIcon,
    'trunk': TrunkIcon,
    'tokenPile': TokenIcon,
};
export type BoardIcon = {
    size?: 'sm' | 'lg' | 'md',
    type?: FieldComponentKey | NeutalFieldComponentKey,
} & React.HTMLAttributes<HTMLDivElement>;
export const BoardIcon = ({
    size = 'sm',
    type,
    ...rest
}: BoardIcon) => {
    const Icon = type
        ? BoardIconMap[type]
        : undefined;

    return <BoardIconContainer $size={size} className="board-icon" {...rest}>
        {Icon && <Icon />}
    </BoardIconContainer>;
};