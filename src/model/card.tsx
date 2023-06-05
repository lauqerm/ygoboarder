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
    'Normal',
    'Field',
    'Equip',
    'Continuous',
    'Quick-Play',
    'Ritual',
];
export const TrapRaceList = [
    'Normal',
    'Continuous',
    'Counter',
];