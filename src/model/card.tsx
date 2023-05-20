import { YGOProCardResponse } from './ygopro';

export type PhaseType = 'up' | 'down';
export type Position = 'atk' | 'def';

export const CardSize = {
    sm: {
        width: 86,
        height: 125,
    },
};

export const ygoproCardToDescription = (card: YGOProCardResponse) => {
    const {
        name,
        atk, def,
        level, frameType,
        linkval, linkmarkers,
        attribute,
        race,
        type,
        desc,
    } = card;
    const isMonster = type.toLowerCase().includes('monster')
        || type.toLowerCase().includes('token');
    const isXyzMonster = frameType === 'xyz';
    const isLinkMonster = frameType === 'link';
    const rating = isXyzMonster
        ? `RANK ${level}`
        : isLinkMonster
            ? `LINK ${linkval}`
            : isMonster
                ? `LEVEL ${level}`
                : null;
    const stat = isMonster
        ? `ATK: ${atk}${isLinkMonster ? '' : ` / DEF: ${def}`}`
        : undefined;
    const category = `${race} ${type}`;
    const normalizedLinkMarkerList = Array.isArray(linkmarkers)
        ? linkmarkers.join(', ')
        : linkmarkers;

    return `${name}
${[rating, attribute, category].filter(Boolean).join(' ')}
${[stat, normalizedLinkMarkerList].filter(Boolean).join(' ')}
${desc}
    `;
};