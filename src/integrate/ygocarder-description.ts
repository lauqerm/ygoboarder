const linkValueTextMap: Record<string, string> = {
    '2': 'Top',
    '8': 'Bottom',
    '4': 'Left',
    '6': 'Right',
    '7': 'Bottom-Left',
    '9': 'Bottom-Right',
    '1': 'Top-Left',
    '3': 'Top-Right',
};
const subFamilyTitleMap: Record<string, string> = {
    'NO ICON': 'Normal',
    'CONTINUOUS': 'Continuous',
    'QUICK-PLAY': 'Quick-Play',
    'RITUAL': 'Ritual',
    'FIELD': 'Field',
    'COUNTER': 'Counter',
};
export const ygoCarderToDescription = (card: Record<string, any>) => {
    const {
        name,
        atk, def,
        frame,
        attribute,
        star,
        subFamily,
        linkMap,
        typeAbility,
        isPendulum,
        effect, pendulumEffect,
    } = card;
    const isMonster = frame !== 'spell' && frame !== 'trap';
    const isToken = frame === 'token';
    const isXyzMonster = frame === 'xyz';
    const isLinkMonster = frame === 'link';
    const rating = isXyzMonster
        ? `RANK ${star}`
        : isLinkMonster
            ? `LINK ${linkMap.length}`
            : isMonster
                ? `LEVEL ${star}`
                : null;
    const stat = isMonster
        ? `ATK: ${atk}${isLinkMonster ? '' : ` / DEF: ${def}`}`
        : undefined;
    const desc = isPendulum
        ? `[ Pendulum Effect ] ${pendulumEffect}
[ Monster Effect ] ${effect}`
        : effect;
    const normalizedSTFrameName = frame === 'spell' ? 'Spell' : 'Trap';
    const category = isMonster
        ? `${typeAbility.join(' ')} Monster${isToken ? ' Token' : ''}`
        : `${subFamilyTitleMap[subFamily]} ${normalizedSTFrameName}`;
    const normalizedLinkMarkerList = isLinkMonster && Array.isArray(linkMap)
        ? linkMap.map(entry => linkValueTextMap[entry]).join(', ')
        : '';

    return `${name}
${[rating, isMonster ? attribute : '', category].filter(Boolean).join(' ').trim()}
${[stat, normalizedLinkMarkerList].filter(Boolean).join(' ').trim()}
${desc}
    `.trim();
};