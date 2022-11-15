import { List } from 'immutable';
import React from 'react';
import { DECK_TYPE } from 'src/model';
import { useBoardStore, useDeckStore } from 'src/state';

export const ExportButton = () => {
    const allDeckList = useDeckStore(
        state => state.deckMap,
    );
    const allBoard = useBoardStore(
        state => state.boardList,
    );

    return <button onClick={() => {
        let result: Record<string, { type: DECK_TYPE, value: string[] }> = {};
        let deckTypeMap: Record<string, DECK_TYPE> = {};

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
            boardList.forEach(card => {
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

type TransferableData = Record<string, { type: DECK_TYPE, value: string[] }>;
export type ImportButton = {
    onImport: (importedData: TransferableData) => void,
}
export const ImportButton = ({
    onImport,
}: ImportButton) => {
    const value = '{"DECK":{"type":"permanent","value":["","https://i.imgur.com/NM1vrsS.png"]},"TRUNK":{"type":"consistent","value":["https://i.imgur.com/YgaX2lG.png","","https://i.imgur.com/p9Ogumt.png"]},"GY":{"type":"transient","value":["https://i.imgur.com/zYH5QtC.png"]}}';

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