import { List } from 'immutable';

export const mergeClass = (...args: (string | undefined | null)[]) => {
    return (args ?? []).filter(Boolean).join(' ');
};

export const isLieInside = (point: { x: number, y: number }, rect: { top: number, left: number, right: number, bottom: number }) => {
    return (point.x >= rect.left) && (point.x <= rect.right) && (point.y >= rect.top) && (point.y <= rect.bottom);
};

export const shuffleDeck = (currentDeckList: List<any>) => {
    /**
     * Chuyển về dạng array native để tăng tốc việc shuffle
     */
    const nativeDeckList = currentDeckList.toArray();
    let currentIndex = currentDeckList.size, randomIndex;

    // Thuật toán shuffle in-place cơ bản
    while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [nativeDeckList[currentIndex], nativeDeckList[randomIndex]] = [
            nativeDeckList[randomIndex],
            nativeDeckList[currentIndex],
        ];
    }

    return currentDeckList.map((_value, key) => nativeDeckList[key]);
};

export const exportAsJson = (content: any) => {
    const filename = `${new Date().toISOString()}-board.json`;
    const jsonStr = typeof content === 'string' ? content : JSON.stringify(content);

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

export const getAbsoluteRect = (rect: {
    top?: number, bottom?: number,
    right?: number, left?: number,
    x?: number, y?: number,
    width?: number, height?: number,
}) => {
    const { top, right, bottom, left, x, y, width, height } = rect;
    return {
        x: (x ?? 0) + window.scrollX,
        y: (y ?? 0) + window.scrollY,
        top: (top ?? 0) + window.scrollY,
        right: (right ?? 0) + window.scrollX,
        bottom: (bottom ?? 0) + window.scrollY,
        left: (left ?? 0) + window.scrollX,
        width: width ?? 0,
        height: height ?? 0,
    };
};

export const isJsonObjectEqual = (payload1: any, payload2: any) => {
    /**
     * Check `array`, `object` và `null`
     */
    if (typeof payload1 === 'object' && typeof payload2 === 'object') {
        if (payload1 === null || payload2 === null) return payload1 === payload2;

        if (Array.isArray(payload1) && Array.isArray(payload2)) {
            if (payload1.length !== payload2.length) return false;

            for (let cnt = 0; cnt < payload1.length; cnt++) {
                if (isJsonObjectEqual(payload1[cnt], payload2[cnt]) === false) return false;
            }
            return true;
        }

        if (payload1.toString() === '[object Object]' && payload2.toString() === '[object Object]') {
            if (Object.keys(payload1).length !== Object.keys(payload2).length) return false;

            for (const key in payload1) {
                if (isJsonObjectEqual(payload1[key], payload2[key]) === false) return false;
            }
            return true;
        }

        return payload1 === payload2;
    }
    /**
     * Check `number` và `string`
     */
    return payload1 === payload2;
};

export { createIndexQueue } from './index-queue';
export { uploadToImgur } from './upload';