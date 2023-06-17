export type PhaseType = 'up' | 'down';
export type Position = 'atk' | 'def';

export const CardSize = {
    sm: {
        width: 86,
        height: 125,
    },
};

export const CardRaceToBitMap: Record<string, number> = {
    'Aqua': 2 ** 0,
    'Beast': 2 ** 1,
    'Beast-Warrior': 2 ** 2,
    'Creator-God': 2 ** 3,
    'Cyberse': 2 ** 4,
    'Dinosaur': 2 ** 5,
    'Divine-Beast': 2 ** 6,
    'Dragon': 2 ** 7,
    'Fairy': 2 ** 8,
    'Fiend': 2 ** 9,
    'Fish': 2 ** 10,
    'Insect': 2 ** 11,
    'Machine': 2 ** 12,
    'Plant': 2 ** 13,
    'Psychic': 2 ** 14,
    'Pyro': 2 ** 15,
    'Reptile': 2 ** 16,
    'Rock': 2 ** 17,
    'Sea Serpent': 2 ** 18,
    'Spellcaster': 2 ** 19,
    'Thunder': 2 ** 20,
    'Warrior': 2 ** 21,
    'Winged Beast': 2 ** 22,
    'Wyrm': 2 ** 23,
    'Zombie': 2 ** 24,

    'Normal': 2 ** 25,
    'Field': 2 ** 26,
    'Equip': 2 ** 27,
    'Continuous': 2 ** 28,
    'Quick-Play': 2 ** 29,
    'Ritual': 2 ** 30,

    'Counter': 2 ** 31,

    'Illusionist': 2 ** 32,
};
export const CardRaceList = Object.keys(CardRaceToBitMap);
export const MonsterRaceList = [
    'Aqua',
    'Beast',
    'Beast-Warrior',
    'Creator-God',
    'Cyberse',
    'Dinosaur',
    'Divine-Beast',
    'Dragon',
    'Fairy',
    'Fiend',
    'Fish',
    'Illusionist',
    'Insect',
    'Machine',
    'Plant',
    'Psychic',
    'Pyro',
    'Reptile',
    'Rock',
    'Sea Serpent',
    'Spellcaster',
    'Thunder',
    'Warrior',
    'Winged Beast',
    'Wyrm',
    'Zombie',
];
export const SpellRaceList = [
    'Continuous',
    'Equip',
    'Field',
    'Normal',
    'Quick-Play',
    'Ritual',
];
export const TrapRaceList = [
    'Continuous',
    'Counter',
    'Normal',
];
export const SpellTrapRaceList = [
    'Continuous',
    'Counter',
    'Equip',
    'Field',
    'Normal',
    'Quick-Play',
    'Ritual',
];

export const MonsterFrameToBitMap: Record<string, number> = {
    'Fusion': 2 ** 10,
    'Synchro': 2 ** 11,
    'XYZ': 2 ** 12, /** không hiểu sao in hoa */
    'Link': 2 ** 13,
    'Ritual': 2 ** 14,
};
export const MonsterFrameList = Object.keys(MonsterFrameToBitMap);

export const MonsterAbilitySubtypeToBitMap: Record<string, number> = {
    'Effect': 2 ** 0,
    'Normal': 2 ** 1,
    'Pendulum': 2 ** 2,
    'Special Summon': 2 ** 3,
    'Tuner': 2 ** 4,

    'Flip': 2 ** 5,
    'Gemini': 2 ** 6,
    'Spirit': 2 ** 7,
    'Toon': 2 ** 8,
    'Union': 2 ** 9,
};
export const MonsterAbilitySubtypeList = Object.keys(MonsterAbilitySubtypeToBitMap);
export const MonsterAbilitySubtypeGroup = {
    'Classification': [
        'Effect',
        'Normal',
        'Pendulum',
        'Special Summon',
        'Tuner',
    ],
    'Ability': [
        'Flip',
        'Gemini',
        'Spirit',
        'Toon',
        'Union',
    ],
};
/** Nếu monster có ability này thì mặc nhiên imply subtype / ability khác */
export const MonsterAbilityImplicationMap: Record<string, number> = {
    'Flip': MonsterAbilitySubtypeToBitMap['Effect'],
    'Gemini': MonsterAbilitySubtypeToBitMap['Effect'],
    'Spirit': MonsterAbilitySubtypeToBitMap['Effect'],
    'Toon': MonsterAbilitySubtypeToBitMap['Effect'],
    'Union': MonsterAbilitySubtypeToBitMap['Effect'],
};

export const MonsterMainFrameIndex: Record<string, number> = {
    normal: 0,
    effect: 1,
    ritual: 2,
    fusion: 3,
    synchro: 4,
    xyz: 5,
    link: 6,
};
export const DefaultMonsterMainFrame = Object.keys(MonsterMainFrameIndex).length + 1;