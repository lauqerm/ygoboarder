import { useEffect } from 'react';
import { CardImage, PhaseType, Position } from 'src/model';
import { useCountStore } from 'src/state';
import { mergeClass } from 'src/util';
import { DelayedImage } from './card-image';
import './card.scss';

export type Card = {
    image: CardImage,
    size?: 'sm' | 'md' | 'lg',
    origin: string,
    phase?: PhaseType,
    position?: Position,
} & React.HTMLAttributes<HTMLDivElement>;
export const Card = ({
    image,
    size = 'sm',
    origin,
    phase,
    position,
    ...rest
}: Card) => {
    const changeCount = useCountStore(state => state.set);
    const type = image.get('type');
    const imgSource = type === 'external'
        ? image.get('dataURL')
        : type === 'internal'
            ? image.get('data')
            : undefined;
    
    useEffect(() => {
        changeCount(origin, 1);

        return () => {
            changeCount(origin, -1);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div {...rest} className={mergeClass('ygo-card', `ygo-card-size-${size}`, `ygo-card-position-${position}`)}>
        <DelayedImage type={type === 'external' ? 'URL' : 'Base64'} className="card-image" src={imgSource} />
        {phase === 'down' && <img className="card-back card-back-flashing" src="/asset/img/ygo-card-back-normal.png" alt="card-back" />}
    </div>;
};