import React, { useEffect, useState } from 'react';
import './card.scss';

type ImageSourceEntry = {
    source?: string,
    resolved: boolean,
}
/** 20 image / 1s là giới hạn của ygoprodeck, a.k.a 50ms delay is minimum */
const queueDelayTime = 200;
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
                }, queueDelayTime);
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
 * Làm ra để tránh limit card image của YGORPO, ảnh trong component này sẽ load tuần tự, với số lượng mỗi giây dưới ngưỡng cho trước.
 * 
 * Card có một delay ngắn để có thể loại bỏ image bị unmount trước khi kịp vào queue.
 */
export type DelayedImage = React.ImgHTMLAttributes<HTMLImageElement> & { type: 'URL' | 'Base64' };
export const DelayedImage = ({ src, type, ...rest }: DelayedImage) => {
    const [actualSrc, setActualSrc] = useState(type === 'URL' && imageSourceMap.isResolved(src) === false ? undefined : src);
    const [isReady, setReady] = useState(false);

    useEffect(() => {
        let relevant = true;
        setTimeout(() => {
            if (relevant) setReady(true);
        }, 500);

        return () => {
            relevant = false;
        };
    }, []);

    useEffect(() => {
        let relevant = true;

        if (isReady) {
            if (type === 'URL' && imageSourceMap.isResolved(src) === false) {
                imageSourceMap.add(src);
                imageSourceMap.get(src)
                    .then(resolvedSrc => {
                        if (relevant) setActualSrc(resolvedSrc);
                    });
            } else {
                if (relevant) setActualSrc(src);
            }
        }

        return () => {
            relevant = false;
        };
    }, [isReady, type, src]);

    return <img
        {...rest}
        loading="lazy"
        alt="card"
        src={actualSrc ?? `${process.env.PUBLIC_URL}/asset/img/ygo-card-back-neutral.png`}
        onLoad={() => {
            imageSourceMap.resolve(actualSrc);
        }}
    />;
};