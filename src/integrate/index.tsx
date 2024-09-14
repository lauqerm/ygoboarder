import { clone } from 'ramda';
import { cardFieldShortenMap, getDefaultCard, YGOCarderCard } from './ygocarder';
import { JSONUncrush } from './json-uncrush';

export const rebuildYGOCarderData = (
    card: Record<string, any> | string,
    isCondensed = false,
) => {
    let fullCard: Record<string, any>;
    if (isCondensed) {
        try {
            fullCard = reverseCardDataCondenser(card);
        } catch (e) {
            fullCard = typeof card === 'string'
                ? reverseCardDataCondenser(JSON.parse(card))
                : card;
            console.error(e);
        }
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

/** Migrate old version of card data into the new version without information loss */
export const migrateCardData = (card: Record<string, any>, baseCard = getDefaultCard()): YGOCarderCard => {
    const migratedCard = {
        ...baseCard,
        ...clone(card),
    };

    if (migratedCard.effectStyle == null) {
        migratedCard.effectStyle = {
            ...getDefaultCard().effectStyle,
        };
    }

    if (migratedCard.version == null) migratedCard.version = 1;
    if (migratedCard.format == null) migratedCard.format = 'tcg';
    if (migratedCard.pendulumFrame == null) migratedCard.pendulumFrame = 'auto';
    if (migratedCard.finish == null) migratedCard.finish = [];

    if (migratedCard.artFinish == null) migratedCard.artFinish = 'normal';
    if ((migratedCard as any).picture && !card.art) migratedCard.art = (migratedCard as any).picture;
    delete (migratedCard as any).picture;

    /** Seems like no image is fine for now. */
    // if ((migratedCard.art ?? '') === '') migratedCard.art = 'https://i.imgur.com/jjtCuG5.png';
    if ((migratedCard.art ?? '') === '') migratedCard.art = '';

    if ((migratedCard as any).kanjiHelper && !card.furiganaHelper) migratedCard.furiganaHelper = (migratedCard as any).kanjiHelper;
    delete (migratedCard as any).kanjiHelper;
    if (migratedCard.furiganaHelper === undefined) migratedCard.furiganaHelper = true;

    if ((migratedCard as any).passcode && !card.password) migratedCard.password = (migratedCard as any).passcode;
    delete (migratedCard as any).passcode;

    if (!migratedCard.starAlignment) migratedCard.starAlignment = 'auto';

    return migratedCard;
};

export { ygoCarderToDescription } from './ygocarder-description';