import { clone } from 'ramda';
import { cardFieldShortenMap, defaultYGOCarderCard } from './ygocarder';
import { JSONUncrush } from './json-uncrush';

export const rebuildYGOCarderData = (
    card: Record<string, any> | string,
    isCondensed = false,
) => {
    let fullCard: Record<string, any>;
    if (isCondensed) {
        fullCard = reverseCardDataCondenser(card);
    } else {
        fullCard = typeof card === 'string'
            ? JSON.parse(card)
            : card;
    }

    return migrateCardData(fullCard);
};

const reverseCardDataCondenser = (
    condensedCard: Record<string, any> | string,
    shortenMap: Record<string, any> = cardFieldShortenMap,
) => {
    const normalizedCondensedCard = typeof condensedCard === 'string'
        ? JSON.parse(JSONUncrush(decodeURIComponent(condensedCard)))
        : condensedCard;

    const fullCard: Record<string, any> = {};
    Object.keys(shortenMap).forEach(fullKey => {
        const shortendValue = shortenMap[fullKey];

        if (typeof shortendValue === 'object' && shortendValue !== null && !Array.isArray(shortendValue)) {
            const shortendKey = shortendValue?._newKey;

            if (shortendKey && normalizedCondensedCard[shortendKey]) {
                fullCard[fullKey] = reverseCardDataCondenser(normalizedCondensedCard[shortendKey], shortenMap[fullKey]);
            }
        } else {
            if (normalizedCondensedCard[shortendValue]) {
                fullCard[fullKey] = normalizedCondensedCard[shortendValue];
            }
        }
    });
    return fullCard;
};

// Try to match old version card data with newer model
const migrateCardData = (card: Record<string, any>) => {
    const migratedCard = clone(card);

    if (migratedCard.effectStyle === undefined) {
        migratedCard.effectStyle = {
            ...defaultYGOCarderCard.effectStyle,
        };
    }

    if (migratedCard.version === undefined) {
        migratedCard.version = 1;
    }
    return migratedCard;
};

export { ygoCarderToDescription } from './ygocarder-description';