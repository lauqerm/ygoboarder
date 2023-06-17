import { notification } from 'antd';
import { List } from 'immutable';
import { CardPreset, DeckType, PhaseType } from 'src/model';
import { PhaseBehavior, useBoardState, useDeckState, useDescriptionState } from 'src/state';
import { exportAsJson } from 'src/util';
import styled from 'styled-components';

const JSONUploadInput = styled.input`
    display: none;
`;

export const ExportButton = () => {
    const allDeckList = useDeckState(state => state.deckMap);
    const allBoard = useBoardState(state => state.boardMap);
    const allDescription = useDescriptionState(state => state.descriptionMap);

    return <div
        className="menu-button"
        onClick={() => {
            const resultDeckList: TransferableData['deckList'] = {};
            const descriptionMap: Record<string, string> = {};

            allDeckList.forEach(deckList => {
                const type = deckList.get('type');
                const name = deckList.get('name');
                resultDeckList[name] = {
                    type,
                    defaultPhase: deckList.get('defaultPhase'),
                    phaseBehavior: deckList.get('phaseBehavior'),
                    preset: deckList.get('preset'),
                    cardList: [],
                };
                deckList.get('cardList', List()).forEach(card => {
                    const cardData = card.get('card').get('dataURL');
                    if (cardData) {
                        resultDeckList[name].cardList.push(cardData);
                        descriptionMap[cardData] = allDescription[cardData];
                    }
                });
            });
            allBoard.forEach(boardList => {
                boardList.get('boardCardList').forEach(card => {
                    const origin = card.get('origin');

                    const cardData = card.get('card').get('dataURL');
                    if (cardData && origin) {
                        resultDeckList[origin].cardList.push(cardData);
                        descriptionMap[cardData] = allDescription[cardData];
                    }
                });
            });

            try {
                exportAsJson({
                    deckList: resultDeckList,
                    descriptionMap: descriptionMap,
                });
            } catch (e) {
                console.error(e);
                notification.error({
                    message: 'Export failed',
                });
            }
        }}>Export</div>;
};

type TransferableDeck = {
    type: DeckType,
    defaultPhase: PhaseType,
    phaseBehavior: PhaseBehavior,
    preset: CardPreset,
    cardList: string[],
};
type TransferableData = {
    deckList: Record<string, TransferableDeck>,
    descriptionMap: Record<string, string>,
};
export type ImportButton = {
    onImport: (importedData: TransferableData) => void,
}
export const ImportButton = ({
    onImport,
}: ImportButton) => {
    const value: TransferableData = {
        deckList: {
            'YOUR-DECK': {
                phaseBehavior: 'always-down',
                defaultPhase: 'down',
                type: 'consistent',
                preset: 'your',
                cardList: [
                    'https://i.imgur.com/NM1vrsS.png',
                ],
            },
            'OP-TRUNK': {
                phaseBehavior: 'always-up',
                defaultPhase: 'up',
                type: 'permanent',
                preset: 'opp',
                cardList: [
                    'https://i.imgur.com/YgaX2lG.png',
                    'https://i.imgur.com/p9Ogumt.png',
                ],
            },
            'YOUR-GY': {
                phaseBehavior: 'always-up',
                defaultPhase: 'up',
                type: 'transient',
                preset: 'your',
                cardList: [
                    'https://i.imgur.com/zYH5QtC.png',
                    'https://i.imgur.com/YgaX2lG.png',
                    'https://i.imgur.com/p9Ogumt.png',
                    'https://i.imgur.com/NM1vrsS.png',
                    'https://i.imgur.com/zYH5QtC.png',
                    'https://i.imgur.com/fM4cbNb.png',
                    'https://i.imgur.com/Y7rRxaV.png',
                    'https://i.imgur.com/q3PxbhU.png',
                    'https://i.imgur.com/4ADMrbA.jpg',
                    'https://i.imgur.com/YgaX2lG.png',
                    'https://i.imgur.com/p9Ogumt.png',
                    'https://i.imgur.com/NM1vrsS.png',
                    'https://i.imgur.com/zYH5QtC.png',
                    'https://i.imgur.com/fM4cbNb.png',
                    'https://i.imgur.com/Y7rRxaV.png',
                    'https://i.imgur.com/q3PxbhU.png',
                    'https://i.imgur.com/4ADMrbA.jpg',
                ],
            },
        },
        descriptionMap: {
            'https://i.imgur.com/4ADMrbA.jpg': '4ADMrbA.jpg',
            'https://i.imgur.com/NM1vrsS.png': 'NM1vrsS.png',
            'https://i.imgur.com/Y7rRxaV.png': 'Y7rRxaV.png',
            'https://i.imgur.com/YgaX2lG.png': 'YgaX2lG.png',
            'https://i.imgur.com/fM4cbNb.png': 'fM4cbNb.png',
            'https://i.imgur.com/p9Ogumt.png': 'p9Ogumt.png',
            'https://i.imgur.com/q3PxbhU.png': 'q3PxbhU.png',
            'https://i.imgur.com/zYH5QtC.png': 'zYH5QtC.png',
        },
    };

    return <>
        <div
            className="menu-button"
            onClick={() => {
                const importedData = window.prompt('Paste imported data', JSON.stringify(value));
                try {
                    if (importedData) {
                        onImport(JSON.parse(importedData));
                    }
                } catch (e) {
                    console.error(e);
                    notification.error({
                        message: 'Import failed',
                    });
                }
            }}
        >
            Text Import
        </div>
        <label className="menu-button" htmlFor="json-upload">File Import</label>
        <JSONUploadInput id="json-upload" className="json-upload-input" type="file" onChange={e => {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    if (typeof e.target?.result === 'string') {
                        onImport(JSON.parse(e.target.result));
                    } else notification.error({
                        message: 'Unreadable file',
                    });
                } catch (e) {
                    console.error(e);
                    notification.error({
                        message: 'Import failed',
                    });
                }
            };
            if (e.target.files) reader.readAsText(e.target.files[0]);
            else { 
                notification.error({
                    message: 'Unreadable file',
                });
            }
        }} />
    </>;
};