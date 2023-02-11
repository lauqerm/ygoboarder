import React, { useEffect, useState } from 'react';
import { CardImage, DeckType } from 'src/model';
import { mergeClass } from 'src/util';
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
            if (source && !sourceMap[source]) sourceMap[source] = { source, resolved: false };
        },
        get: async (name: string | undefined) => {
            if (name) {
                const currentQueue = inQueue.next().value;
                const { source, resolved } = sourceMap[name] ?? {};

                if (source) {
                    /** Chỉ delay với source từ ygoprodeck */
                    if (resolved || source.indexOf('images.ygoprodeck.com') < 0) return source;
                    else {
                        let upcomingQueue;
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
 * Làm ra để tránh limit card image của YGORPO
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
        }
    }, [type, src]);

    return <img {...rest} alt="card" src={actualSrc} onLoad={() => {
        imageSourceMap.resolve(actualSrc);
    }} />;
};