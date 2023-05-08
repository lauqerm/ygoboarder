import { Button, Drawer, Input, Modal, Upload } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CardImageConverter, ImgurResponse, PhaseType } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { useDeckStore } from 'src/state';
import { ExtractProps } from 'src/type';
import { InboxOutlined, StopOutlined } from '@ant-design/icons';
import { Loading } from '../../loading';
import { YGOProImporter } from './ygopro-importer';
import styled from 'styled-components';
import axios from 'axios';
import './deck-import.scss';
import { CardBack } from 'src/component/atom';

const { Dragger } = Upload;

type RcFile = Parameters<NonNullable<ExtractProps<typeof Dragger>['beforeUpload']>>[0];

export type DeckImporterRef = {
    close: () => void,
}
export type DeckImporter = {
    deckId: string,
};
export const DeckImporter = forwardRef<DeckImporterRef, DeckImporter>(({
    deckId,
}: DeckImporter, ref) => {
    const [isOpened, setOpen] = useState(false);
    const imageQueueMap = useRef<Record<string, RcFile>>({});
    const [fileList, setFileList] = useState<{ status: 'finished' | 'canceled' | 'loading' | 'init', fileData: RcFile }[]>([]);
    const [onlineInputKey, setOnlineInputKey] = useState(0);
    const [offlineInputKey, setOfflineInputKey] = useState(0);
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
    const onlineImageValue = useRef('');

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
            mask={false}
        >
            <div className="deck-import-modal">
                <h2>Search on YGOPRODeck</h2>
                <YGOProImporter onSelect={(name, url) => {
                    addToList(
                        deckId,
                        [{
                            card: CardImageConverter({
                                _id: uuidv4(),
                                name: name,
                                type: 'external',
                                data: '',
                                dataURL: url,
                                description: '',
                            }),
                        }],
                    );
                }} />
                <h2>Online image links</h2>
                <Input.TextArea key={`online-upload-${onlineInputKey}`}
                    placeholder="https://my-online-image... (separate by new line)"
                    onChange={e => {
                        onlineImageValue.current = e.target.value;
                    }}
                    cols={64}
                    rows={8}
                />
                <Button onClick={() => {
                    addToList(
                        deckId,
                        (onlineImageValue.current ?? '')
                            .split('\n')
                            .filter(entry => typeof entry === 'string' && entry.length > 0)
                            .map(entry => ({
                                card: CardImageConverter({
                                    _id: uuidv4(),
                                    type: 'external',
                                    name: entry,
                                    dataURL: entry,
                                    data: '',
                                }),
                            })),
                    );
                    setOnlineInputKey(cnt => cnt + 1);
                }}>Add</Button>
                <h2>Upload offline images</h2>
                <i>Offline images will be uploaded to <a target="_blank" href="https://www.imgur.com" rel="noreferrer">imgur.com</a> to store online.</i>
                <Dragger key={`offline-upload-${offlineInputKey}`}
                    className="deck-import-dragger"
                    type="drag"
                    accept="image/*"
                    listType="picture-card"
                    multiple
                    fileList={[]}
                    onRemove={target => {
                        delete imageQueueMap.current[target.uid];
                    }}
                    beforeUpload={file => {
                        setFileList(list => [{ status: 'init', fileData: file }, ...list]);
                        imageQueueMap.current[file.uid] = file;
                        return false;
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">{'Choose or drag image(s) to this area to upload'}</p>
                </Dragger>
                <div className="file-item-grid">
                    {fileList
                        // .filter(({ status }) => status !== 'finished')
                        .map(({ fileData }) => {
                            return <FileItem key={fileData.uid}
                                fileData={fileData}
                                onCancel={name => {
                                    setFileList(list => list.map(entry => {
                                        return entry.fileData.name === name
                                            ? { ...entry, status: 'canceled' }
                                            : entry;
                                    }));
                                }}
                                onFinish={(dataAsURL: string, name: string) => {
                                    setFileList(list => list.map(entry => {
                                        return entry.fileData.name === name
                                            ? { ...entry, status: 'finished' }
                                            : entry;
                                    }));
                                    addToList(
                                        deckId,
                                        [{
                                            card: CardImageConverter({
                                                _id: uuidv4(),
                                                name: name,
                                                type: 'external',
                                                data: '',
                                                dataURL: dataAsURL,
                                            }),
                                        }],
                                    );
                                }}
                                onOfflineFinish={(dataAsString: string, name: string) => {
                                    setFileList(list => list.map(entry => {
                                        return entry.fileData.name === name
                                            ? { ...entry, status: 'finished' }
                                            : entry;
                                    }));
                                    addToList(
                                        deckId,
                                        [{
                                            card: CardImageConverter({
                                                _id: uuidv4(),
                                                name: name,
                                                type: 'internal',
                                                data: dataAsString,
                                                dataURL: '',
                                            }),
                                        }],
                                    );
                                }}
                            />;
                        })}
                </div>
                <input type="file" onChange={event => {
                    // Updating the state
                    console.log(event.target.files);
                }} />
                {loading && <Loading.FullView />}
            </div>
        </Drawer>
    </>;
});

const FileItemContainer = styled.div`
    display: inline-block;
    border: var(--bd-faint);
    border-radius: var(--br-sm);
    .file-status {
        text-align: center;
        color: var(--color-faint);
        font-size: var(--fs-sm);
        border-bottom: var(--bd-faint);
    }
    .file-image {
        position: relative;
        width: var(--card-width-sm);
        height: var(--card-height-sm);
        line-height: 0;
        > img {
            max-width: 100%;
            max-height: 100%;
        }
    }
    .file-action {
        border-top: var(--bd-faint);
    }
    .file-action-cancel {
        text-align: center;
        color: var(--main-danger);
        cursor: pointer;
        &:hover {
            color: var(--contrast-danger);
            background-color: var(--main-danger);
        }
    }
`;

type FileItem = {
    fileData: RcFile,
    onFinish: (dataAsString: string, name: string) => void,
    onOfflineFinish: (dataAsString: string, name: string) => void,
    onCancel: (name: string) => void,
}
const FileItem = ({
    fileData,
    onFinish,
    onOfflineFinish,
    onCancel,
}: FileItem) => {
    const [thumb, setThumb] = useState<string>('');
    const [cancel, setCancel] = useState(false);

    useEffect(() => {
        const reader = new FileReader();

        reader.onload = e => {
            const { target } = e;
            if (target) {
                const { result } = target;
                if (typeof result === 'string') {
                    setThumb(result);
                    /** Bật phần này khi cần test offline */
                    if (!cancel) onOfflineFinish(result, fileData.name);
                    else onCancel(fileData.name);

                    // const imgurFormData = new FormData();
                    // imgurFormData.append('image', fileData);
                    // axios.post<ImgurResponse>(
                    //     'https://api.imgur.com/3/image',
                    //     imgurFormData,
                    //     {

                    //         headers: {
                    //             'Authorization': 'Client-ID f9bbe0da263580e',
                    //         },
                    //     },
                    // ).then(response => {
                    //     if (!cancel) onFinish(result, response.data.link);
                    //     else onCancel(fileData.name);
                    // }).catch(e => {
                    //     console.error(e);
                    // });
                }
            }
        };
        reader.readAsDataURL(fileData);
    }, []);

    return <FileItemContainer className="file-item">
        <div className="file-status">Uploading</div>
        <div className="file-image">
            {thumb
                ? <img src={thumb} alt={fileData.name} />
                : <CardBack />}
            <Loading.FullView size="small" />
        </div>
        <div className="file-action">
            <div className="file-action-cancel" onClick={() => setCancel(true)}><StopOutlined /></div>
        </div>
    </FileItemContainer>;
};