import { List } from 'immutable';
import React from 'react';
import { CardPreset, DeckType, PhaseType } from 'src/model';
import { PhaseBehavior, useBoardStore, useDeckStore } from 'src/state';

export const ExportButton = () => {
    const allDeckList = useDeckStore(
        state => state.deckMap,
    );
    const allBoard = useBoardStore(
        state => state.boardMap,
    );

    return <button onClick={() => {
        let result: Record<string, { type: DeckType, value: string[] }> = {};
        let deckTypeMap: Record<string, DeckType> = {};

        allDeckList.forEach(deckList => {
            const type = deckList.get('type');
            const id = deckList.get('name');
            deckList.get('cardList', List()).forEach(card => {
                if (!result[id]) {
                    result[id] = { type, value: [] };
                    deckTypeMap[id] = type;
                }
                const cardData = card.get('card').get('dataURL');
                if (cardData) result[id].value.push(cardData);
            });
        });
        allBoard.forEach(boardList => {
            boardList.get('boardCardList').forEach(card => {
                const origin = card.get('origin');
                const originType = deckTypeMap[origin] ?? 'vanish';
                if (!result[origin]) {
                    result[origin] = { type: originType, value: [] };
                    deckTypeMap[origin] = originType;
                }
                const cardData = card.get('card').get('dataURL');
                if (cardData) result[origin].value.push(cardData);
            });
        });

        console.log(JSON.stringify(result));
    }}>Export</button>;
};

type TransferableData = Record<string, {
    type: DeckType,
    defaultPhase: PhaseType,
    phaseBehavior: PhaseBehavior,
    preset: CardPreset,
    value: { imageURL: string, description: string }[],
}>;
export type ImportButton = {
    onImport: (importedData: TransferableData) => void,
}
export const ImportButton = ({
    onImport,
}: ImportButton) => {
    const value = {
        'YOUR-DECK': {
            'phaseBehavior': 'always-down',
            'defaultPhase': 'down',
            'type': 'permanent',
            'preset': 'your',
            'value': [
                {
                    'imageURL': 'https://i.imgur.com/NM1vrsS.png',
                    'description': '',
                },
            ],
        },
        'OP-TRUNK': {
            'phaseBehavior': 'always-up',
            'defaultPhase': 'up',
            'type': 'consistent',
            'preset': 'opp',
            'value': [
                {
                    'imageURL': 'https://i.imgur.com/YgaX2lG.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/p9Ogumt.png',
                    'description': '',
                },
            ],
        },
        'YOUR-GY': {
            'phaseBehavior': 'always-up',
            'defaultPhase': 'up',
            'type': 'transient',
            'preset': 'your',
            'value': [
                {
                    'imageURL': 'https://i.imgur.com/zYH5QtC.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/YgaX2lG.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/p9Ogumt.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/NM1vrsS.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/zYH5QtC.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/fM4cbNb.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/Y7rRxaV.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/q3PxbhU.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/4ADMrbA.jpg',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/YgaX2lG.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/p9Ogumt.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/NM1vrsS.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/zYH5QtC.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/fM4cbNb.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/Y7rRxaV.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/q3PxbhU.png',
                    'description': '',
                },
                {
                    'imageURL': 'https://i.imgur.com/4ADMrbA.jpg',
                    'description': '',
                },
            ],
        },
    };

    return <button onClick={() => {
        const importedData = window.prompt('Paste imported data', JSON.stringify(value));
        try {
            if (importedData) onImport(JSON.parse(importedData));
        } catch (e) {
            console.error(e);
        }
    }}>
        Import
    </button>;
};