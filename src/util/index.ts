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

export { createIndexQueue } from './index-queue';