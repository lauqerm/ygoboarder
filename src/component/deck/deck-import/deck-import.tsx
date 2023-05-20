import { Alert, Button, Drawer, Input, Modal, Tooltip, Upload } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CardImageConverter, CardPreset, ImgurResponse, PhaseType } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { useDeckStore, useDescriptionStore } from 'src/state';
import { ExtractProps } from 'src/type';
import { InboxOutlined, StopOutlined, WarningOutlined } from '@ant-design/icons';
import { Loading } from '../../loading';
import { YGOProImporter } from './ygopro-importer';
import styled from 'styled-components';
import axios, { AxiosError } from 'axios';
import { CardBack } from 'src/component/atom';
import TextArea from 'antd/lib/input/TextArea';
import './deck-import.scss';
import { OfflineImporter } from './offline-import';
import { OnlineImporter } from './online-import';

const { Dragger } = Upload;

type RcFile = Parameters<NonNullable<ExtractProps<typeof Dragger>['beforeUpload']>>[0];

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
    const [fileList, setFileList] = useState<{
        status: 'finished' | 'canceled' | 'loading' | 'init',
        fileData: RcFile,
        resultURL?: string,
    }[]>([]);
    console.log('🚀 ~ file: deck-import.tsx:34 ~ fileList:', fileList);
    const [onlineInputKey, setOnlineInputKey] = useState(0);
    const [offlineInputKey, setOfflineInputKey] = useState(0);
    const addDescription = useDescriptionStore(state => state.set);
    const resetUpload = () => {
        setOnlineInputKey(cnt => cnt + 1);
        setOfflineInputKey(cnt => cnt + 1);
    };
    const {
        addToList,
    } = useDeckStore(
        state => ({
            addToList: state.add,
        }),
        () => true,
    );
    const [loading, setLoading] = useState(false);
    const [offlineUploadQueue, setOfflineUploadQueue] = useState<{ url: string, description: string }[]>([]);

    useImperativeHandle(ref, () => ({
        close: () => {
            setOpen(false);
        },
    }));

    return <>
        <Button type="primary" onClick={() => setOpen(true)}>Add cards</Button>
        <Drawer
            title="Add cards"
            open={isOpened}
            onClose={() => setOpen(false)}
            width={'40%'}
            mask={false}
        >
            <div className="deck-import-modal">
                <h2>Search on YGOPRODeck</h2>
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
                <h2>Online image links</h2>
                <OnlineImporter key={`online-upload-${onlineInputKey}`}
                    deckId={deckId}
                    preset={preset}
                />
                <OfflineImporter key={`offline-upload-${offlineInputKey}`}
                    deckId={deckId}
                    preset={preset}
                />
                <input type="file" onChange={event => {
                    // Updating the state
                    console.log(event.target.files);
                }} />
                {loading && <Loading.FullView />}
            </div>
        </Drawer>
    </>;
});
