import { useEffect, useRef } from 'react';
import { BaseCard, PhaseType, Position } from 'src/model';
import { useCountState, useDescriptionState, usePreviewState } from 'src/state';
import { mergeClass } from 'src/util';
import { DelayedImage } from './card-image';
import { CardBack } from '../atom';
import styled from 'styled-components';
import { RollbackOutlined } from '@ant-design/icons';
import './card.scss';

const CardCornerFront = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    line-height: 0;
    padding: var(--spacing-xs);
    border: var(--bd);
    background: #ffffff88;
    border-top-right-radius: var(--br);
    cursor: pointer;
    &:hover {
        background: #ffffff;
    }
`;
export type Card = {
    baseCard: BaseCard,
    size?: 'sm' | 'md' | 'lg',
    origin: string,
    phase?: PhaseType,
    position?: Position,
    isReversed?: boolean,
    /** Fake card là card ảo, không được đếm và chỉ là copy của một card thật khác */
    fake?: boolean,
    snippet?: boolean,
    cornerBack?: boolean,
    onCornerClick?: React.MouseEventHandler<HTMLImageElement>,
    flashing?: boolean,
    chilren?: React.ReactNode,
} & React.HTMLAttributes<HTMLDivElement>;
export const Card = ({
    baseCard,
    size = 'sm',
    origin,
    phase,
    position,
    isReversed,
    fake,
    snippet,
    flashing,
    cornerBack,
    children,
    onCornerClick,
    ...rest
}: Card) => {
    const changeCount = useCountState(state => state.set);
    const type = baseCard.get('type');
    const imgSource = type === 'external'
        ? baseCard.get('dataURL')
        : type === 'internal'
            ? baseCard.get('data')
            : undefined;
    const preset = baseCard.get('preset');
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const preview = usePreviewState(state => state.setCardPreview);

    useEffect(() => {
        if (!fake) changeCount(origin, 1);

        const target = cardContainerRef.current;
        const openPreview = () => {
            if (baseCard.get('type') === 'external') {
                preview(
                    'external',
                    baseCard.get('dataURL'),
                    baseCard.get('isOfficial'),
                    useDescriptionState.getState().descriptionMap[baseCard.get('dataURL')],
                );
            } else {
                preview('internal', baseCard.get('data'), false);
            }
        };
        if (target) target.addEventListener('mouseenter', openPreview);

        return () => {
            if (!fake) changeCount(origin, -1);
            if (target) target.removeEventListener('mouseenter', openPreview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={cardContainerRef}
        {...rest}
        className={mergeClass(
            'ygo-card',
            `ygo-card-size-${size}`,
            `ygo-card-position-${position}`,
            isReversed ? 'ygo-card-reversed' : '',
            (phase === 'down' && cornerBack) ? 'ygo-card-partial-down' : '',
            snippet ? 'ygo-card-snippet' : '',
        )}
    >
        {snippet
            ? <div className="card-snippet">
                <img src={`${process.env.PUBLIC_URL}/asset/img/token-sample.png`} alt="token-sample" />
            </div>
            : <DelayedImage type={type === 'external' ? 'URL' : 'Base64'} className="card-image" src={imgSource} />}
        {phase === 'down'
            ? <CardBack
                cornerBack={cornerBack}
                preset={preset}
                flashing={flashing}
                onClick={onCornerClick}
            />
            : cornerBack
                ? <CardCornerFront
                    onClick={onCornerClick}
                >
                    <RollbackOutlined />
                </CardCornerFront>
                : null}
        {children}
    </div>;
};