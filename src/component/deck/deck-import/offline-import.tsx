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
import TextArea from 'antd/lib/input';

const { Dragger } = Upload;
type RcFile = Parameters<NonNullable<ExtractProps<typeof Dragger>['beforeUpload']>>[0];

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
type FileItemRef = {
    getDescription: () => string | undefined,
}
const FileItem = forwardRef<FileItemRef, FileItem>(({
    fileData,
    onFinish,
    onOfflineFinish,
    onCancel,
}: FileItem, ref) => {
    const [thumb, setThumb] = useState<string>('');
    const [cancel, setCancel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>();
    const description = useRef('');

    useImperativeHandle(ref, () => ({
        getDescription: () => description.current,
    }));

    useEffect(() => {
        const reader = new FileReader();

        reader.onload = async e => {
            const { target } = e;
            if (target) {
                const { result } = target;
                if (typeof result === 'string') {
                    setThumb(result);
                    setLoading(true);
                    /** Bật phần này khi cần test offline */
                    if (!cancel) onOfflineFinish(result, fileData.name);
                    else onCancel(fileData.name);

                    // const imgurFormData = new FormData();
                    // imgurFormData.append('image', fileData);

                    // try {
                    //     const response = await axios.post<ImgurResponse>(
                    //         'https://api.imgur.com/3/image',
                    //         imgurFormData,
                    //         {

                    //             headers: {
                    //                 'Authorization': 'Client-ID f9bbe0da263580e',
                    //             },
                    //         },
                    //     );
                    //     if (!cancel) onFinish(response.data.data.link, fileData.name);
                    //     else onCancel(fileData.name);
                    // } catch (e: any) {
                    //     setError(e.message);
                    //     onCancel(fileData.name);
                    // }
                    setLoading(false);
                }
            }
        };
        reader.readAsDataURL(fileData);
    }, []);

    return <FileItemContainer className="file-item">
        <div>
            <div className="file-status">
                {error
                    ? <>Error <Tooltip overlay={`${error}`}><WarningOutlined /></Tooltip></>
                    : loading
                        ? 'Uploading'
                        : 'Finished'}
            </div>
            <div className="file-image">
                {thumb
                    ? <img src={thumb} alt={fileData.name} />
                    : <CardBack />}
                {loading && <Loading.FullView size="small" />}
            </div>
            {loading && <div className="file-action">
                <div className="file-action-cancel" onClick={() => setCancel(true)}><StopOutlined /> Cancel</div>
            </div>}
        </div>
        <div>
            <Input.TextArea
                placeholder="Card description"
                onChange={e => description.current = e.target.value}
            />
        </div>
    </FileItemContainer>;
});

export type OfflineFile = {
    status: 'finished' | 'canceled' | 'loading' | 'init',
    fileData: RcFile,
    resultURL?: string,
};
export type OfflineImporter = {
    deckId: string,
    preset: CardPreset,
}
export const OfflineImporter = ({
    deckId,
    preset,
}: OfflineImporter) => {
    const imageQueueMap = useRef<Record<string, RcFile>>({});
    const addToList = useDeckStore(state => state.add);
    const refMap = useRef<Record<string, FileItemRef | null>>({});
    const [fileList, setFileList] = useState<OfflineFile[]>([]);

    const addDescription = useDescriptionStore(state => state.set);

    return <div className="offline-importer">
        <h2>Upload offline images</h2>
        <i>Offline images will be uploaded to <a target="_blank" href="https://www.imgur.com" rel="noreferrer">imgur.com</a> to store online.</i>
        <Dragger
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
        <Alert
            showIcon
            type="info"
            message="If many descriptions are bound with the same image link, only the latest description will be saved."
        />
        <div className="file-item-grid">
            {fileList
                // .filter(({ status }) => status !== 'finished')
                .map(({ fileData }) => {
                    return <FileItem key={fileData.uid} ref={ref => refMap.current[fileData.uid] = ref}
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
                                    ? {
                                        ...entry,
                                        status: 'finished',
                                        resultURL: dataAsURL,
                                    }
                                    : entry;
                            }));
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
                                        preset,
                                    }),
                                }],
                            );
                        }}
                    />;
                })}
        </div>
        {fileList.length > 0 && <Button
            type="primary"
            disabled={fileList.some(entry => entry.status !== 'finished' && entry.status !== 'canceled')}
            onClick={() => {
                addToList(
                    deckId,
                    fileList.map(({ fileData, resultURL }) => ({
                        card: CardImageConverter({
                            _id: uuidv4(),
                            name: fileData.name,
                            type: 'external',
                            data: '',
                            dataURL: resultURL,
                            preset,
                        }),
                    })),
                );
                addDescription(fileList.map(({ fileData, resultURL }) => ({
                    key: resultURL,
                    description: refMap.current[fileData.uid]?.getDescription(),
                })));
                setFileList([]);
            }}
        >
            {'Add'}
        </Button>}
    </div>;
};