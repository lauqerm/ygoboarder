import { Alert, Button, Input, Modal, Tooltip, Upload } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CardImageConverter, CardPreset, ImgurResponse } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { useDeckState, useDescriptionState } from 'src/state';
import { ExtractProps } from 'src/type';
import { InboxOutlined, StopOutlined, WarningOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Loading } from '../../loading';
import styled from 'styled-components';
import axios from 'axios';
import { CardBack } from 'src/component/atom';
import { rebuildYGOCarderData, ygoCarderToDescription } from 'src/integrate';

const { Dragger } = Upload;
type RcFile = Parameters<NonNullable<ExtractProps<typeof Dragger>['beforeUpload']>>[0];

const FileItemContainer = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: var(--spacing);
    margin: var(--spacing) 0;
    .file-status {
        text-align: center;
        color: var(--color-faint);
        font-size: var(--fs-sm);
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
    .ant-input {
        height: 100%;
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
    .file-action-retry {
        text-align: center;
        color: var(--main-info);
        cursor: pointer;
        &:hover {
            color: var(--contrast-info);
            background-color: var(--main-info);
        }
    }
`;
type FileItem = {
    fileData: RcFile,
    onStart: (name: string) => void,
    onFinish: (dataAsString: string, name: string) => void,
    onOfflineFinish: (dataAsString: string, name: string) => void,
    onCancel: (name: string) => void,
    onRemove: () => void,
}
type FileItemRef = {
    getDescription: () => string | undefined,
}
const FileItem = forwardRef<FileItemRef, FileItem>(({
    fileData,
    onStart,
    onFinish,
    onOfflineFinish,
    onCancel,
    onRemove,
}: FileItem, ref) => {
    const [thumb, setThumb] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [finish, setFinish] = useState(false);
    const [error, setError] = useState<any>();
    const [retry, setRetry] = useState(0);
    // const [refreshCnt, setRefreshCnt] = useState(0);
    // const refresh = () => setRefreshCnt(cur => cur + 1);
    const cancel = useRef(false);
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
                    onStart?.(fileData.name);
                    /** Bật phần này khi cần test offline */
                    // if (!cancel.current) {
                    //     onOfflineFinish(result, fileData.name);
                    //     setFinish(true);
                    // }
                    // else onCancel(fileData.name);

                    const imgurFormData = new FormData();
                    imgurFormData.append('image', fileData);

                    try {
                        const response = await axios.post<ImgurResponse>(
                            'https://api.imgur.com/3/image',
                            imgurFormData,
                            {
                                headers: {
                                    'Authorization': 'Client-ID f9bbe0da263580e',
                                },
                            },
                        );
                        if (!cancel.current) {
                            onFinish(response.data.data.link, fileData.name);
                            setFinish(true);
                        }
                        else onCancel(fileData.name);
                    } catch (e: any) {
                        setError(e.message);
                        onCancel(fileData.name);
                    }
                    setLoading(false);
                }
            }
        };
        reader.readAsDataURL(fileData);

        return () => {
            setLoading(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retry]);

    return <FileItemContainer className="file-item">
        <div>
            <div className="file-image">
                {thumb
                    ? <img src={thumb} alt={fileData.name} />
                    : <CardBack />}
                {loading && <Loading.FullView size="small" />}
            </div>
            <div className="file-action">
                {loading && <div className="file-action-cancel" onClick={() => {
                    cancel.current = true;
                    setLoading(false);
                }}>
                    <StopOutlined /> Cancel
                </div>}
                {(finish || error) && <div className="file-action-cancel" onClick={() => onRemove()}><DeleteOutlined /> Remove</div>}
                {(cancel.current || error) && <div className="file-action-retry" onClick={() => {
                    cancel.current = false;
                    setRetry(cur => cur + 1);
                }}>
                    <ReloadOutlined /> Retry
                </div>}
            </div>
            <div className="file-status">
                {error
                    ? <>Error <Tooltip overlay={`${error}`}><WarningOutlined /></Tooltip></>
                    : loading
                        ? 'Uploading'
                        : cancel.current
                            ? 'Canceled'
                            : 'Finished'}
            </div>
        </div>
        <div>
            <Input.TextArea
                placeholder="Card description"
                onChange={event => {
                    try {
                        description.current = ygoCarderToDescription(rebuildYGOCarderData(event.target.value, true));
                    } catch (error) {
                        description.current = event.target.value;
                    }
                }}
            />
        </div>
    </FileItemContainer>;
});

const OfflineImporterContainer = styled.div`
    .ant-alert {
        margin-bottom: var(--spacing);
    }
    .deck-import-dragger {
        margin-top: var(--spacing-xs);
    }
    .action-button {
        display: grid;
        height: 100%;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr min-content;
        .description-textarea {
            grid-column: span 2;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom: none;
        }
        .add-button {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
        .add-close-button {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-left-radius: 0;
        }
    }
`;
export type OfflineFile = {
    status: 'finished' | 'canceled' | 'loading' | 'init',
    fileData: RcFile,
    resultURL?: string,
};
export type OfflineImporter = {
    deckId: string,
    preset: CardPreset,
    onClose: () => void,
}
export const OfflineImporter = ({
    deckId,
    preset,
    onClose,
}: OfflineImporter) => {
    const imageQueueMap = useRef<Record<string, RcFile>>({});
    const addToList = useDeckState(state => state.add);
    const refMap = useRef<Record<string, FileItemRef | null>>({});
    const [fileList, setFileList] = useState<OfflineFile[]>([]);

    const addDescription = useDescriptionState(state => state.set);
    const submit = () => {
        const finishedFileList = fileList.filter(entry => entry.status === 'finished');
        const uploadingFileList = fileList.filter(entry => entry.status === 'loading');
        const confirmSubmit = () => {
            addToList(
                deckId,
                finishedFileList.map(({ fileData, resultURL }) => ({
                    card: CardImageConverter({
                        _id: uuidv4(),
                        name: fileData.name,
                        type: 'external',
                        data: '',
                        dataURL: resultURL,
                        preset,
                        isOfficial: false,
                    }),
                })),
            );
            addDescription(finishedFileList.map(({ fileData, resultURL }) => ({
                key: resultURL,
                description: refMap.current[fileData.uid]?.getDescription(),
            })));
            setFileList([]);
        };
        if (uploadingFileList.length > 0) {
            Modal.confirm({
                title: 'Files are still uploading',
                content: 'Submit right now will make you lose all remaining progresses, continue?',
                onOk: confirmSubmit,
            });
        } else {
            confirmSubmit();
        }
    };

    return <OfflineImporterContainer className="offline-importer">
        <h2>Upload offline images</h2>
        <Alert
            showIcon
            type="info"
            message={<>
                Offline images will be uploaded to <a target="_blank" href="https://www.imgur.com" rel="noreferrer">imgur.com</a> to store online.
                <br />
                Duplications of the same image will be treated as different images altogether, and descriptions will not be synced correctly.
            </>}
        />
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
        <div className="file-item-grid">
            {fileList
                // .filter(({ status }) => status !== 'finished')
                .map(({ fileData }) => {
                    return <FileItem key={fileData.uid} ref={ref => refMap.current[fileData.uid] = ref}
                        fileData={fileData}
                        onStart={name => {
                            setFileList(list => list.map(entry => {
                                return entry.fileData.name === name
                                    ? { ...entry, status: 'loading' }
                                    : entry;
                            }));
                        }}
                        onRemove={() => {
                            setFileList(list => list.filter(entry => entry.fileData.uid !== fileData.uid));
                        }}
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
        {fileList.length > 0 && <div className="action-button">
            <Button
                className="add-button"
                onClick={submit}
            >
                Add
            </Button>
            <Button
                type="primary"
                className="add-close-button"
                onClick={() => {
                    submit();
                    onClose();
                }}
            >
                Add and Close
            </Button>
        </div>}
    </OfflineImporterContainer>;
};