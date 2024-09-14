import { Modal, Upload, Input, Button, notification } from 'antd';
import React, { useImperativeHandle, useRef, useState } from 'react';
import styled from 'styled-components';
import { DelayedImage } from '../card';
import { CardPreview, useDescriptionState, usePreviewState } from 'src/state';
import { rebuildYGOCarderData, ygoCarderToDescription } from 'src/integrate';
import { Loading } from '../loading';
import { uploadToImgur } from 'src/util';
import { RcFile } from 'src/model';

const { TextArea } = Input;
const ImageReplaceModalContainer = styled.div`
    .card-manager-cell {
        display: grid;
        grid-template-columns: var(--card-width-md) 1fr;
        column-gap: var(--spacing);
        + .card-manager-cell {
            margin-top: var(--spacing-lg);
        }
        .image img {
            max-width: 100%;
            max-height: 30rem;
        }
        .editor {
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            .description-editor {
                margin-top: var(--spacing);
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
            }
            .description-textarea {
                height: 100%;
            }
            .manager-action {
                display: flex;
                margin-top: var(--spacing-sm);
                column-gap: var(--spacing-sm);
            }
        }
    }
`;

export type ImageReplaceModalRef = {
    setTarget: (cardPreview: CardPreview) => void,
}
export type ImageReplaceModal = {}
export const ImageReplaceModal = React.forwardRef<ImageReplaceModalRef>(({

}: ImageReplaceModal, ref) => {
    const currentPreview = usePreviewState(
        state => state.cardPreview,
        (prev, next) => {
            if (prev.type !== next.type) return false;
            if (prev.description !== next.description) return false;
            if (prev.isOfficial !== next.isOfficial) return false;
            return (next.type === 'external' && prev.dataURL === next.dataURL)
                || (next.type === 'internal' && prev.data === next.data);
        },
    );
    const preview = usePreviewState(state => state.setCardPreview);

    const [targetList, setTargetList] = useState<CardPreview[]>([]);
    const draftMap = useRef<Record<string, string>>({});

    const [uploadMap, setUploadMap] = useState<Record<string, { uploading: boolean }>>({});

    const [resetMap, setResetMap] = useState<Record<string, number>>({});

    const addDescription = useDescriptionState(state => state.set);

    const submit = (dataURL: string) => {
        if (draftMap.current[dataURL] !== '' && dataURL.length > 0) {
            let processedDescription = draftMap.current[dataURL];
            try {
                processedDescription = ygoCarderToDescription(rebuildYGOCarderData(draftMap.current[dataURL], true));
            } catch (error) {
            }
            addDescription([{ key: dataURL, description: processedDescription }], true);
            if (dataURL === currentPreview.dataURL) {
                preview(
                    'keep',
                    'external',
                    dataURL,
                    false,
                    processedDescription,
                );
            }
            setTargetList(cur => {
                return cur.map(entry => {
                    if (entry.dataURL === dataURL) return { ...entry, description: processedDescription };
                    return entry;
                });
            });
            setResetMap(cur => ({
                ...cur,
                [dataURL]: (cur[dataURL] ?? 0) + 1,
            }));
        }
    };

    useImperativeHandle(ref, () => ({
        setTarget: cardPreview => {
            const { dataURL, description } = cardPreview;

            setTargetList([cardPreview]);
            draftMap.current[dataURL] = description;
            setResetMap(cur => ({
                ...cur,
                [dataURL]: (cur[dataURL] ?? 0) + 1,
            }));
        },
    }));

    return <Modal
        title="Custom Card Management"
        width={'60rem'}
        open={targetList.length > 0}
        onCancel={() => {
            setTargetList([]);
        }}
    >
        <ImageReplaceModalContainer className="">
            <div className="card-manager-list">
                {targetList.map(({ dataURL, description, type }) => {
                    return <div key={`${dataURL}${resetMap[dataURL]}`} className="card-manager-cell">
                        <div className="image">
                            <DelayedImage
                                type="URL"
                                src={dataURL}
                            />
                        </div>
                        <div className="editor">
                            {uploadMap[dataURL]?.uploading && <Loading.FullView />}
                            <Upload.Dragger
                                className="inline-image-uploader"
                                maxCount={1}
                                accept=".jpg,.png,.jpeg,.gif"
                                showUploadList={false}
                                customRequest={async option => {
                                    const { file } = option;

                                    if (typeof file === 'object' && (file as any)['uid']) {
                                        uploadToImgur(
                                            file as RcFile,
                                            {
                                                onBeforeStart: (_, fileData) => {
                                                    setUploadMap(cur => {
                                                        const newCur = { ...cur };
                                                        newCur[dataURL] = {
                                                            uploading: true,
                                                        };

                                                        return newCur;
                                                    });
                                                },
                                                onError: (error) => {
                                                    notification.error(error.message);
                                                },
                                                onSuccess: (response, fileData) => {
                                                    // addDescription([{ key: dataURL, description: processedDescription }], true);
                                                    // if (dataURL === currentPreview.dataURL) {
                                                    //     preview(
                                                    //         'keep',
                                                    //         'external',
                                                    //         dataURL,
                                                    //         false,
                                                    //         processedDescription,
                                                    //     );
                                                    // }
                                                    // setTargetList(cur => {
                                                    //     return cur.map(entry => {
                                                    //         if (entry.dataURL === dataURL) return { ...entry, description: processedDescription };
                                                    //         return entry;
                                                    //     });
                                                    // });
                                                    setResetMap(cur => ({
                                                        ...cur,
                                                        [dataURL]: (cur[dataURL] ?? 0) + 1,
                                                    }));
                                                },
                                                onFinish: () => {
                                                    setUploadMap(cur => {
                                                        const newCur = { ...cur };
                                                        newCur[dataURL] = {
                                                            uploading: false,
                                                        };

                                                        return newCur;
                                                    });
                                                },
                                            },
                                        );
                                    }
                                }}
                            >
                                Replace Image
                            </Upload.Dragger>
                            <div className="description-editor">
                                <TextArea
                                    autoFocus
                                    className="description-textarea"
                                    defaultValue={description}
                                    onChange={e => draftMap.current[dataURL] = e.target.value}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && e.shiftKey) {
                                            submit(dataURL);
                                        }
                                    }}
                                />
                                <div className="manager-action">
                                    <Button className="save-button" onClick={() => submit(dataURL)} type="primary">Update</Button>
                                    <Button className="dismiss-button" onClick={() => setResetMap(cur => ({
                                        ...cur,
                                        [dataURL]: (cur[dataURL] ?? 0) + 1,
                                    }))}>Reset</Button>
                                </div>
                            </div>
                        </div>
                    </div>;
                })}
            </div>
        </ImageReplaceModalContainer>
    </Modal>;
});