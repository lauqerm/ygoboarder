import { PreviewState, useDescriptionStore, usePreviewStore } from 'src/state';
import styled from 'styled-components';
import { DelayedImage } from './card-image';
import { CardBack, Credit } from '../atom';
import { useRef, useState } from 'react';
import TextArea from 'antd/lib/input/TextArea';
import { mergeClass } from 'src/util';
import { Button } from 'antd';

const CardPreviewContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: var(--main-secondary);
    border: var(--bd);
    border-right: none;
    height: 100%;
    overflow: hidden;
    max-width: 35rem;
    min-width: calc(var(--card-width-md) + 2 * var(--spacing-xl));
    .card-preview-image-container {
        width: var(--card-width-md);
        height: var(--card-height-md);
        margin: var(--spacing-xl);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-self: flex-end;
        > img {
            max-width: 100%;
            max-height: 100%;
        }
    }
    .card-preview-description {
        background-color: var(--main-secondaryLighter);
        border-top: var(--bd);
        flex: 1 1 auto;
        padding: var(--spacing);
        overflow: hidden;
    }
    .card-preview-description-read {
        height: 100%;
        padding: var(--spacing-sm);
        background-color: var(--dim);
        overflow-y: scroll;
        cursor: pointer;
        word-break: break-word;
        > :first-child {
            font-weight: bold;
            font-size: var(--fs-lg);
        }
        white-space: pre-line;
        &:hover {
            background: var(--gradient-hovered);
        }
    }
    .card-preview-description-edit {
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
        .save-button {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
        .dismiss-button {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-left-radius: 0;
        }
    }
`;
export const CardPreviewer = () => {
    const dynamicState = usePreviewStore(
        state => state.cardPreview,
        (prev, next) => {
            if (prev.type !== next.type) return false;
            if (prev.description !== next.description) return false;
            return (next.type === 'external' && prev.dataURL === next.dataURL)
                || (next.type === 'internal' && prev.data === next.data);
        },
    );
    const preview = usePreviewStore(state => state.setCardPreview);
    const addDescription = useDescriptionStore(state => state.set);
    const [lockedData, setLockedData] = useState<PreviewState['cardPreview'] | undefined>(undefined);
    const draftDescription = useRef('');
    const {
        data,
        dataURL,
        type,
        description,
    } = lockedData ?? dynamicState;
    const noCard = (type === 'external' && dataURL.length <= 0)
        || (type === 'internal' && data.length <= 0);
    const submit = () => {
        if (draftDescription.current !== '' && dataURL.length > 0) {
            addDescription([{ key: dataURL, description: draftDescription.current }], true);
            if (dataURL === dynamicState.dataURL) preview('external', dataURL, draftDescription.current);
            draftDescription.current = '';
        }
        setLockedData(undefined);
    };

    return <CardPreviewContainer className={mergeClass('card-preview', lockedData ? 'card-preview-locked' : '')}>
        <div className="card-preview-image-container">
            {noCard
                ? <CardBack size="md" className="card-preview-image" />
                : <DelayedImage
                    className="card-preview-image"
                    type={type === 'external' ? 'URL' : 'Base64'}
                    src={type === 'external' ? dataURL : data}
                />}
        </div>
        <div className="card-preview-description">
            {lockedData
                ? <div className="card-preview-description-edit">
                    <TextArea
                        autoFocus
                        className="description-textarea"
                        defaultValue={description}
                        onChange={e => draftDescription.current = e.target.value}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && e.shiftKey) {
                                submit();
                            } else if (e.key === 'Escape') {
                                setLockedData(undefined);
                            }
                        }}
                    />
                    <Button className="save-button" onClick={submit} type="primary">Save</Button>
                    <Button className="dismiss-button" onClick={() => setLockedData(undefined)}>Dismiss</Button>
                </div>
                : noCard
                    ? <Credit />
                    : <div className="card-preview-description-read" onClick={() => setLockedData(dynamicState)}>
                        {description.split('\n').map((text, index) => <div key={index}>{text}</div>)}
                        {(dataURL.length > 0 && !noCard && (description ?? '').length === 0) && <div>Add your description here</div>}
                    </div>}
        </div>
    </CardPreviewContainer>;
};