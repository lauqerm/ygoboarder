import { List } from 'immutable';
import React from 'react';
import { DeckType } from 'src/model';
import { useBoardStore, useDeckStore } from 'src/state';

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

type TransferableData = Record<string, { type: DeckType, value: string[] }>;
export type ImportButton = {
    onImport: (importedData: TransferableData) => void,
}
export const ImportButton = ({
    onImport,
}: ImportButton) => {
    const value = '{"YOUR-DECK":{"type":"permanent","value":["https://i.imgur.com/NM1vrsS.png"]},"OP-TRUNK":{"type":"consistent","value":["https://i.imgur.com/YgaX2lG.png","https://i.imgur.com/p9Ogumt.png"]},"YOUR-GY":{"type":"transient","value":["https://i.imgur.com/zYH5QtC.png","https://i.imgur.com/YgaX2lG.png","https://i.imgur.com/p9Ogumt.png","https://i.imgur.com/NM1vrsS.png","https://i.imgur.com/zYH5QtC.png","https://i.imgur.com/fM4cbNb.png","https://i.imgur.com/Y7rRxaV.png","https://i.imgur.com/q3PxbhU.png","https://i.imgur.com/4ADMrbA.jpg","https://i.imgur.com/YgaX2lG.png","https://i.imgur.com/p9Ogumt.png","https://i.imgur.com/NM1vrsS.png","https://i.imgur.com/zYH5QtC.png","https://i.imgur.com/fM4cbNb.png","https://i.imgur.com/Y7rRxaV.png","https://i.imgur.com/q3PxbhU.png","https://i.imgur.com/4ADMrbA.jpg"]}}';

    return <button onClick={() => {
        const importedData = window.prompt('Paste imported data', value);
        try {
            if (importedData) onImport(JSON.parse(importedData));
        } catch (e) {
            console.error(e);
        }
    }}>
        Import
    </button>;
};