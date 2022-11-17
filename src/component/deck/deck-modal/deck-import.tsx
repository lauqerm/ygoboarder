import { Button, Input, Modal, Upload } from 'antd';
import { useRef, useState } from 'react';
import { CardImageConverter } from 'src/model';
import { v4 as uuidv4 } from 'uuid';
import { useDeckStore } from 'src/state';
import { ExtractProps } from 'src/type';
import { InboxOutlined } from '@ant-design/icons';
import { Loading } from '../../loading';
import './deck-import.scss';

const { Dragger } = Upload;

type RcFile = Parameters<NonNullable<ExtractProps<typeof Dragger>['beforeUpload']>>[0];

export type DeckImporter = {
    deckId: string,
};
export const DeckImporter = ({
    deckId,
}: DeckImporter) => {
    const [isOpened, setOpen] = useState(false);
    const imageQueueMap = useRef<Record<string, RcFile>>({});
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
    const onSubmit = () => {
        setLoading(true);
        /** [ONLINE IMAGE] */
        addToList(
            deckId,
            (onlineImageValue.current ?? '')
                .split('\n')
                .filter(entry => typeof entry === 'string' && entry.length > 0)
                .map(entry => CardImageConverter({
                    _id: uuidv4(),
                    type: 'external',
                    name: entry,
                    dataURL: entry,
                    data: '',
                })),
        );
        /** [OFFLINE IMAGE] */
        let finishedCount = 0;
        let imageQueue = Object.values(imageQueueMap.current);
        if (imageQueue.length) {
            imageQueue.forEach(image => {
                const reader = new FileReader();
    
                reader.onload = e => {
                    const target = e.target;
                    if (target) {
                        if (typeof target.result === 'string') {
                            addToList(
                                deckId,
                                [CardImageConverter({
                                    _id: uuidv4(),
                                    name: image.name,
                                    type: 'internal',
                                    data: reader.result as string,
                                    dataURL: '',
                                })],
                            );
                            finishedCount++;
                            if (finishedCount === imageQueue.length) {
                                imageQueueMap.current = {};
                                resetUpload();
                                setLoading(false);
                                setOpen(false);
                            }
                        }
                    }
                };
                reader.readAsDataURL(image);
                // const imgurFormData = new FormData();
                // imgurFormData.append('image', target);
                // axios.post<ImgurResponse>(
                //     'https://api.imgur.com/3/image',
                //     imgurFormData,
                //     {

                //         headers: {
                //             'Authorization': 'Client-ID f9bbe0da263580e',
                //         },
                //     },
                // ).then(response => {
                //     console.log(response);
                // }).catch(e => {
                //     console.error(e);
                // });
            });
        } else {
            resetUpload();
            setLoading(false);
            setOpen(false);
        }
    };

    return <>
        <Button type="primary" onClick={() => setOpen(true)}>Add cards</Button>
        <Modal
            title="Add cards"
            open={isOpened}
            onCancel={() => setOpen(false)}
            onOk={onSubmit}
            okText={'Add'}
        >
            <div className="deck-import-modal">
                <h2>Online image links</h2>
                <Input.TextArea key={`online-upload-${onlineInputKey}`}
                    placeholder="https://my-online-image... (separate by new line)"
                    onChange={e => {
                        onlineImageValue.current = e.target.value;
                    }}
                    cols={64}
                    rows={12}
                />
                <h2>Upload offline images</h2>
                <i>Offline images will be uploaded to <a target="_blank" href="https://www.imgur.com" rel="noreferrer">imgur.com</a> to store online.</i>
                <Dragger key={`offline-upload-${offlineInputKey}`}
                    className="deck-import-dragger"
                    type="drag"
                    accept="image/*"
                    listType="picture-card"
                    multiple
                    onRemove={target => {
                        delete imageQueueMap.current[target.uid];
                    }}
                    beforeUpload ={file => {
                        imageQueueMap.current[file.uid] = file;
                        return false;
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">{'Choose or drag image(s) to this area to upload'}</p>
                </Dragger>
                {loading && <Loading.FullView />}
            </div>
        </Modal>
    </>;
};