import { Input, Button, Tooltip } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CardImageConverter, CardPreset } from 'src/model';
import { useDeckStore, useDescriptionStore } from 'src/state';
import { v4 as uuidv4 } from 'uuid';
import { InboxOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { CardBack } from 'src/component/atom';
import { Loading } from 'src/component/loading';

type FileItem = {
    uid: string,
    url: string,
    onCancel: (uid: string) => void,
}
type FileItemRef = {
    getDescription: () => string | undefined,
}
const FileItem = forwardRef<FileItemRef, FileItem>(({
    uid,
    url,
    onCancel,
}: FileItem, ref) => {
    const description = useRef('');

    useImperativeHandle(ref, () => ({
        getDescription: () => description.current,
    }));

    return <div className="file-item">
        <div>
            <div className="file-image">
                <img src={url} alt={url} />
            </div>
            <div className="file-action">
                <div className="file-action-cancel" onClick={() => onCancel(uid)}><DeleteOutlined /> Remove</div>
            </div>
        </div>
        <div>
            <Input.TextArea
                placeholder="Card description"
                onChange={e => description.current = e.target.value}
            />
        </div>
    </div>;
});

export type OnlineFile = {
    uid: string,
    resultURL: string,
};
export type OnlineImporter = {
    deckId: string,
    preset: CardPreset,
}
export const OnlineImporter = ({
    deckId,
    preset,
}: OnlineImporter) => {
    const rawValue = useRef('');
    const addDescription = useDescriptionStore(state => state.set);
    const addToList = useDeckStore(state => state.add);
    const [fileList, setFileList] = useState<OnlineFile[]>([]);
    const [inputKey, setInputKey] = useState(0);
    const refMap = useRef<Record<string, FileItemRef | null>>({});

    const importURL = () => {
        setFileList((rawValue.current ?? '')
            .split('\n')
            .filter(entry => typeof entry === 'string' && entry.length > 0)
            .map(entry => ({ resultURL: entry, status: 'init', uid: uuidv4() })));
        rawValue.current = '';
        setInputKey(cur => cur + 1);
    };

    return <div className="online-importer">
        <Input.TextArea key={`text-${inputKey}`}
            placeholder="https://my-online-image... (separate by new line)"
            onChange={e => {
                rawValue.current = e.target.value;
            }}
            cols={64}
            rows={8}
            onKeyDown={e => {
                if (e.key === 'Enter' && e.shiftKey) importURL();
            }}
        />
        <Button
            type="primary"
            onClick={importURL}
        >
            {'Import'}
        </Button>
        <div className="file-item-list">
            {fileList.map(({ uid, resultURL }) => {
                return <FileItem key={uid} ref={ref => refMap.current[uid] = ref}
                    uid={uid}
                    url={resultURL}
                    onCancel={uid => setFileList(fileList => fileList.filter(({ uid: targetUId }) => targetUId !== uid))}
                />;
            })}
        </div>
        <Button onClick={() => {
            addToList(
                deckId,
                fileList.map(({ resultURL }) => ({
                    card: CardImageConverter({
                        _id: uuidv4(),
                        name: resultURL,
                        type: 'external',
                        data: '',
                        dataURL: resultURL,
                        preset,
                    }),
                })),
            );
            addDescription(fileList.map(({ uid, resultURL }) => ({
                key: resultURL,
                description: refMap.current[uid]?.getDescription(),
            })));
            setFileList([]);
        }}>Import</Button>
    </div>;
};