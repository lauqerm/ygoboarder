import { Input, Button, Alert } from 'antd';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CardImageConverter, CardPreset } from 'src/model';
import { useDeckStore, useDescriptionStore } from 'src/state';
import { v4 as uuidv4 } from 'uuid';
import { DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const FileItemContainer = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: var(--spacing-sm);
    margin: var(--spacing) 0;
    .file-image {
        width: var(--card-width-sm);
        height: var(--card-height-sm);
        text-align: center;
        img {
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
`;
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

    return <FileItemContainer className="file-item">
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
    </FileItemContainer>;
});

const OnlineImporterContainer = styled.div`
    .ant-alert {
        margin-bottom: var(--spacing);
    }
    .import-input {
        border-bottom: none;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
    }
    .import-button {
        width: 100%;
        border-top-right-radius: 0;
        border-top-left-radius: 0;
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
export type OnlineFile = {
    uid: string,
    resultURL: string,
};
export type OnlineImporter = {
    deckId: string,
    preset: CardPreset,
    onClose: () => void,
}
export const OnlineImporter = ({
    deckId,
    preset,
    onClose,
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
    const submit = () => {
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
    };

    return <OnlineImporterContainer className="online-importer">
        <h2>Import online images</h2>
        <Alert
            showIcon
            type="info"
            message="If many descriptions are bound with the same image link, only the latest description will be saved."
        />
        <Input.TextArea key={`text-${inputKey}`}
            className="import-input"
            autoFocus
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
            onClick={importURL}
            className="import-button"
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
    </OnlineImporterContainer>;
};