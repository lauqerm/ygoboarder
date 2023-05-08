import { useEffect } from 'react';
import { BaseCard, CardPreset, PhaseType, Position } from 'src/model';
import { useCountStore } from 'src/state';
import { mergeClass } from 'src/util';
import { DelayedImage } from './card-image';
import './card.scss';
import { CardBack } from '../atom';

export type Card = {
    baseCard: BaseCard,
    size?: 'sm' | 'md' | 'lg',
    origin: string,
    phase?: PhaseType,
    position?: Position,
    preset?: CardPreset,
    /** Fake card là card ảo, không được đếm và chỉ là copy của một card thật khác */
    fake?: boolean,
    cornerBack?: boolean,
    flashing?: boolean,
} & React.HTMLAttributes<HTMLDivElement>;
export const Card = ({
    baseCard,
    size = 'sm',
    origin,
    phase,
    preset,
    position,
    fake,
    flashing,
    cornerBack,
    ...rest
}: Card) => {
    const changeCount = useCountStore(state => state.set);
    const type = baseCard.get('type');
    const imgSource = type === 'external'
        ? baseCard.get('dataURL')
        : type === 'internal'
            ? baseCard.get('data')
            : undefined;

    useEffect(() => {
        if (!fake) changeCount(origin, 1);

        return () => {
            if (!fake) changeCount(origin, -1);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div {...rest} className={mergeClass('ygo-card', `ygo-card-size-${size}`, `ygo-card-position-${position}`)}>
        <DelayedImage type={type === 'external' ? 'URL' : 'Base64'} className="card-image" src={imgSource} />
        {phase === 'down' && <CardBack
            className={cornerBack ? 'card-back-clipped' : ''}
            preset={preset}
            flashing={flashing}
        />}
    </div>;
};