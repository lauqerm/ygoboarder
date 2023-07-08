import { CardPreset } from 'src/model';
import styled from 'styled-components';
import { mergeClass } from 'src/util';
import { useLayoutEffect, useRef } from 'react';

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
    ${props => props.onClick ? 'cursor: pointer;' : ''}
    user-select: none;
    &.card-back-flashing {
        animation: fade-cycle 4s infinite;
    }
`;
function findAnimByName(elem: Element, name: string) {
    // get all the active animations on this element
    const animationList = elem?.getAnimations();
    // return the first one with the expected animationName
    return animationList.find(animation => (animation as any).animationName === name);
}
export type CardBack = {
    size?: 'sm' | 'lg' | 'md',
    preset?: CardPreset,
    flashing?: boolean,
    cornerBack?: boolean,
} & React.HTMLAttributes<HTMLImageElement>;
export const CardBack = ({
    size = 'sm',
    preset,
    flashing,
    className,
    cornerBack,
    ...rest
}: CardBack) => {
    const target = useRef<HTMLImageElement>(null);
    useLayoutEffect(() => {
        target.current
            ?.addEventListener('animationstart', evt => {
                const current = evt.target;
                const preceded = document.querySelector('.card-back-flashing');
                if (evt.animationName === 'fade-cycle' && current && preceded) {
                    const currentAnim = findAnimByName(current as Element, 'fade-cycle');
                    // Tìm một element khác có animation tương tự trên màn hình
                    const targetAnim = findAnimByName(preceded, 'fade-cycle');
                    // Nếu tồn tại element đó thì synchronize thời gian giữa hai bên
                    if (currentAnim && targetAnim) currentAnim.startTime = targetAnim.startTime;
                }
            });
    }, []);

    return <CardBackImage ref={target}
        $size={size}
        src={`${process.env.PUBLIC_URL}/asset/img/ygo-card-back-${preset ?? 'neutral'}.png`}
        alt="card-back"
        {...rest}
        className={mergeClass(
            'card-back',
            flashing ? 'card-back-flashing' : '',
            cornerBack ? 'card-back-clipped' : '',
            className,
        )}
    />;
};