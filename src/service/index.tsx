import { List } from 'immutable';
import { DeckCard } from 'src/state';

export const shuffleDeck = (currentDeckList: List<DeckCard>) => {
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

export const deactivateAllBeacon = () => {
    document.querySelectorAll('.deck-back-beacon-active').forEach(element => element.classList.remove('deck-back-beacon-active'));
};

export { createIndexQueue } from './index-queue';