import React, { useEffect, useState } from 'react';
import './card.scss';

type ImageSourceEntry = {
    source?: string,
    resolved: boolean,
}
const createImageSourceQueue = () => {
    const sourceMap: Record<string, ImageSourceEntry> = {};
    function* queueGenerator() {
        let counter = 0;
        while (true) {
            yield counter;
            counter += 1;
        }
    }
    async function* delayQueueGenerator() {
        let counter = 0;
        while (true) {
            await new Promise(resolve => {
                setTimeout(() => {
                    resolve(true);
                }, 500);
            });
            yield counter;
            counter += 1;
        }
    }
    const inQueue = queueGenerator();
    const outQueue = delayQueueGenerator();

    return {
        add: (source: string | undefined) => {
            if (source && !sourceMap[source]) {
                sourceMap[source] = { source, resolved: false };
            }
        },
        get: async (name: string | undefined) => {
            if (name) {
                const { source, resolved } = sourceMap[name] ?? {};

                if (source) {
                    /** Chỉ delay với source từ ygoprodeck */
                    if (resolved || source.indexOf('images.ygoprodeck.com') < 0) return source;
                    else {
                        let upcomingQueue;
                        const currentQueue = inQueue.next().value;
                        do {
                            upcomingQueue = (await outQueue.next()).value;
                        } while (upcomingQueue !== currentQueue);
                        return source;
                    }
                }
                return undefined;
            }
            return undefined;
        },
        resolve: (source: string | undefined) => {
            if (source && sourceMap[source]) sourceMap[source].resolved = true;
        },
        isResolved: (source: string | undefined) => {
            if (source && sourceMap[source]?.resolved) return true;
            return false;
        },
    };
};
const imageSourceMap = createImageSourceQueue();

/**
 * Làm ra để tránh limit card image của YGORPO, ảnh trong component này sẽ load tuần tự, với số lượng mỗi giây dưới ngưỡng cho trước
 */
export type DelayedImage = React.ImgHTMLAttributes<HTMLImageElement> & { type: 'URL' | 'Base64' };
export const DelayedImage = ({ src, type, ...rest }: DelayedImage) => {
    const [actualSrc, setActualSrc] = useState(type === 'URL' && imageSourceMap.isResolved(src) === false ? undefined : src);

    useEffect(() => {
        if (type === 'URL' && imageSourceMap.isResolved(src) === false) {
            imageSourceMap.add(src);
            imageSourceMap.get(src)
                .then(resolvedSrc => {
                    setActualSrc(resolvedSrc);
                });
        } else {
            setActualSrc(src);
        }
    }, [type, src]);

    return <img
        {...rest}
        alt="card"
        src={actualSrc ?? '/asset/img/ygo-card-back-neutral.png'}
        onLoad={() => {
            imageSourceMap.resolve(actualSrc);
        }}
    />;
};