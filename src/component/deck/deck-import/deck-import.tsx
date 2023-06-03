import { Button, Drawer, Tabs } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { CardImageConverter, CardPreset } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { useDeckStore, useDescriptionStore } from 'src/state';
import { YGOProImporter } from './ygopro-importer';
import { OfflineImporter } from './offline-importer';
import { OnlineImporter } from './online-importer';
import './deck-import.scss';

export type DeckImporterRef = {
    close: () => void,
}
export type DeckImporter = {
    deckId: string,
    preset: CardPreset,
};
export const DeckImporter = forwardRef<DeckImporterRef, DeckImporter>(({
    deckId,
    preset,
}: DeckImporter, ref) => {
    const [isOpened, setOpen] = useState(false);
    const addDescription = useDescriptionStore(state => state.set);
    const {
        addToList,
    } = useDeckStore(
        state => ({
            addToList: state.add,
        }),
        () => true,
    );

    useImperativeHandle(ref, () => ({
        close: () => {
            setOpen(false);
        },
    }));

    return <>
        <Button type="primary" onClick={() => setOpen(true)}>Add cards</Button>
        <Drawer
            title="Add cards"
            className="deck-import-drawer"
            open={isOpened}
            onClose={() => setOpen(false)}
            width={'730px'}
            mask={false}
            destroyOnClose
        >
            <Tabs className="deck-import-modal">
                <Tabs.TabPane key="ygopro" tab="From YGOPro">
                    <YGOProImporter onSelect={(name, url, description) => {
                        addToList(
                            deckId,
                            [{
                                card: CardImageConverter({
                                    _id: uuidv4(),
                                    name: name,
                                    type: 'external',
                                    data: '',
                                    dataURL: url,
                                    preset,
                                }),
                            }],
                        );
                        addDescription([{ key: url, description }]);
                    }} />
                </Tabs.TabPane>
                <Tabs.TabPane key="online" tab="Online Links">
                    <OnlineImporter
                        deckId={deckId}
                        preset={preset}
                        onClose={() => setOpen(false)}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane key="offline" tab="Offline Images">
                    <OfflineImporter
                        deckId={deckId}
                        preset={preset}
                        onClose={() => setOpen(false)}
                    />
                </Tabs.TabPane>
            </Tabs>
        </Drawer>
    </>;
});
