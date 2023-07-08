import create from 'zustand';

export type DescriptionState = {
    descriptionMap: Record<string, string>
    set: (valueList: { key?: string, description?: string }[], force?: boolean) => void,
};
export const useDescriptionState = create<DescriptionState>((set) => ({
    descriptionMap: {
        'https://images.ygoprodeck.com/images/cards/73915052.jpg': 'Sheep Token\nLEVEL 1 EARTH Beast Token\nATK: 0 / DEF: 0\nThis card can be used as any Token.',
        'https://images.ygoprodeck.com/images/cards/71645243.jpg': 'Rose Token\nLEVEL 2 DARK Plant Token\nATK: 800 / DEF: 800\nSpecial Summoned with the effect of "Black Garden".',
        'https://images.ygoprodeck.com/images/cards/59160189.jpg': 'Torment Token\nLEVEL 3 DARK Fiend Token\nATK: 1000 / DEF: 1000\nThis card can be used as a "Torment Token".\n\n\n*If used for another Token, apply that Token\'s Type/Attribute/Level/ATK/DEF.',
        'https://images.ygoprodeck.com/images/cards/52340445.jpg': 'Sky Striker Ace Token\nLEVEL 1 DARK Warrior Token\nATK: 0 / DEF: 0\nThis card can be used as a "Sky Striker Ace Token".\n\n\n*If used for another Token, apply that Token\'s Type/Attribute/Level/ATK/DEF.',
        'https://images.ygoprodeck.com/images/cards/39972130.jpg': 'Kagemusha Raccoon Token\nLEVEL 1 EARTH Beast Token\nATK: ? / DEF: 0\nSpecial Summoned with the effect of "Number 64: Ronin Raccoon Sandayu". When Summoned, this Token\'s ATK becomes equal to the current ATK of the monster on the field that has the highest ATK (your choice, if tied).',
        'https://images.ygoprodeck.com/images/cards/90884404.jpg': 'Utchatzimime Token\nLEVEL 1 DARK Fiend Token\nATK: 0 / DEF: 0\nSpecial Summoned with the effect of "Phantasmal Lord Ultimitl Bishbaalkin".',
        'https://images.ygoprodeck.com/images/cards/15341822.jpg': 'Fluff Token\nLEVEL 1 WIND Plant Token\nATK: 0 / DEF: 0\nThis card can be used as a "Fluff Token".\n\n*If used for another Token, apply that Token\'s Type/Attribute/Level/ATK/DEF.',
        'https://images.ygoprodeck.com/images/cards/904186.jpg': 'Mecha Phantom Beast Token\nLEVEL 3 WIND Machine Token\nATK: 0 / DEF: 0\nThis card can be used as a "Mecha Phantom Beast Token".\n\n*If used for another Token, apply that Token\'s Type/Attribute/Level/ATK/DEF.',
        'https://images.ygoprodeck.com/images/cards/53855410.jpg': 'Doppel Token\nLEVEL 1 DARK Warrior Token\nATK: 400 / DEF: 400\nThis card can be used as a "Doppel Token".\n\n\n*If used for another Token, apply that Token\'s Type/Attribute/Level/ATK/DEF.',
        'https://images.ygoprodeck.com/images/cards/9929399.jpg': 'Vague Shadow Token\nLEVEL 1 DARK Winged Beast Token\nATK: 0 / DEF: 0\nSpecial Summoned by the effect of "Blackwing - Gofu the Vague Shadow". This Token cannot be Tributed or used as as Synchro Material Monster.',
    },
    set: (valueList, force = false) => set(state => {
        const nextMap = { ...state.descriptionMap };
        valueList.forEach(({ key, description }) => {
            if (typeof key === 'string' && key.length > 0) {
                if ((nextMap[key] ?? '').length <= 0 || force) nextMap[key] = description ?? '';
            }
        });

        return {
            ...state,
            descriptionMap: nextMap,
        };
    }),
}));