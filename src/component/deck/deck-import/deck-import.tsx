import { Drawer, Tabs } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { CardImageConverter, CardPreset } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { useDeckStore, useDescriptionStore } from 'src/state';
import { YGOProImporter } from './ygopro-importer';
import { OfflineImporter } from './offline-importer';
import { OnlineImporter } from './online-importer';
import './deck-import.scss';

export type DeckImporterDrawerRef = {
    getTargetDeckId: () => string | undefined,
    close: () => void,
    open: (deckId: string, preset: CardPreset) => void,
}
export type DeckImporterDrawer = {
    onVisibleChange?: (currentStatus: boolean, targetDeckId?: string) => void,
};
export const DeckImporterDrawer = forwardRef<DeckImporterDrawerRef, DeckImporterDrawer>(({
    onVisibleChange,
}: DeckImporterDrawer, ref) => {
    const [isOpened, setOpen] = useState(false);
    const [deckId, setDeckId] = useState<string | undefined>();
    const [preset, setPreset] = useState<CardPreset | undefined>();
    const addDescription = useDescriptionStore(state => state.set);
    const {
        addToList,
    } = useDeckStore(
        state => ({
            addToList: state.add,
        }),
        () => true,
    );

    useEffect(() => {
        onVisibleChange?.(isOpened, deckId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpened, deckId]);

    useImperativeHandle(ref, () => ({
        getTargetDeckId: () => deckId,
        open: (deckId: string, preset: CardPreset) => {
            setPreset(preset);
            setDeckId(deckId);
            setOpen(true);
        },
        close: () => {
            setOpen(false);
        },
    }));

    if (!deckId || !preset) return null;
    return <Drawer
        title="Add cards"
        className="deck-import-drawer"
        open={isOpened}
        onClose={() => setOpen(false)}
        width={'730px'}
        mask={false}
        destroyOnClose
    >
        <Tabs
            className="deck-import-modal"
            items={[
                {
                    key: 'ygopro',
                    label: 'From YGOPro',
                    children: <YGOProImporter
                        id={deckId}
                        onSelect={(name, url, description) => {
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
                        }}
                    />,
                },
                {
                    key: 'online',
                    label: 'Online Links',
                    children: <OnlineImporter
                        deckId={deckId}
                        preset={preset}
                        onClose={() => setOpen(false)}
                    />,
                },
                {
                    key: 'offline',
                    label: 'Offline Links',
                    children: <OfflineImporter
                        deckId={deckId}
                        preset={preset}
                        onClose={() => setOpen(false)}
                    />,
                },
            ]}
        />
    </Drawer>;
});
