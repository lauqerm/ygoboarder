import { PreviewState, useDescriptionState, useEventState, usePreviewState } from 'src/state';
import styled from 'styled-components';
import { DelayedImage } from '../card';
import { CardBack, Credit } from '../atom';
import { useEffect, useRef, useState } from 'react';
import TextArea from 'antd/lib/input/TextArea';
import { mergeClass } from 'src/util';
import { Button } from 'antd';
import { rebuildYGOCarderData, ygoCarderToDescription } from 'src/integrate';

const CardPreviewContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: var(--main-secondary);
    border: var(--bd);
    border-right: none;
    overflow: hidden;
    max-width: 35rem;
    min-width: calc(var(--card-width-md) + 2 * var(--spacing-xl));
    &.card-preview-custom {
        .card-preview-description-read {
            cursor: pointer;
            &:hover {
                background: var(--gradient-hovered);
            }
        }
    }
    .official-status {
        position: absolute;
        top: var(--spacing);
        right: var(--spacing-2xl);
        background: var(--main-secondary);
        color: white;
        font-size: var(--fs-xs);
        border: var(--bd);
        border-radius: var(--br);
        padding: 0 var(--spacing-sm);
        line-height: 1.375;
    }
    .card-preview-header {
        position: relative;
        display: flex;
        width: 100%;
    }
    .card-preview-image-container {
        width: var(--card-width-md);
        height: var(--card-height-md);
        margin: var(--spacing-xl);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-self: flex-end;
        margin-left: auto;
        > img {
            max-width: 100%;
            max-height: 100%;
        }
    }
    .card-preview-description {
        display: flex;
        flex-direction: column;
        background-color: var(--main-secondaryLighter);
        border-top: var(--bd);
        flex: 1 1 auto;
        padding: var(--spacing-xl);
        overflow: hidden;
        position: relative;
        > div {
            flex: 1;
        }
    }
    .card-preview-description-read {
        height: 100%;
        padding: var(--spacing-sm);
        background-color: var(--dim);
        overflow-y: scroll;
        word-break: break-word;
        white-space: pre-line;
        > :first-child {
            font-weight: bold;
            font-size: var(--fs-lg);
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
export type CardPreviewer = React.PropsWithChildren<{}>;
export const CardPreviewer = ({
    children,
}: CardPreviewer) => {
    const dynamicState = usePreviewState(
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

    const addDescription = useDescriptionState(state => state.set);

    const globalEditDescriptionSignal = useEventState(state => state.editDescriptionSignal);

    const [lockedData, setLockedData] = useState<PreviewState['cardPreview'] | undefined>(undefined);
    const draftDescription = useRef('');
    const {
        data,
        dataURL,
        type,
        description,
        isOfficial,
    } = lockedData ?? dynamicState;
    const noCard = (type === 'external' && dataURL.length <= 0)
        || (type === 'internal' && data.length <= 0);
    const submit = () => {
        if (draftDescription.current !== '' && dataURL.length > 0) {
            let processedDescription = draftDescription.current;
            try {
                processedDescription = ygoCarderToDescription(rebuildYGOCarderData(draftDescription.current, true));
            } catch (error) {
            }
            addDescription([{ key: dataURL, description: processedDescription }], true);
            if (dataURL === dynamicState.dataURL) preview('side', 'external', dataURL, isOfficial, processedDescription);
            draftDescription.current = '';
        }
        setLockedData(undefined);
    };

    const currentEditDescriptionSignal = useRef(0);
    useEffect(() => {
        if (globalEditDescriptionSignal !== currentEditDescriptionSignal.current && !isOfficial && !noCard) {
            currentEditDescriptionSignal.current = globalEditDescriptionSignal;
            setLockedData(dynamicState);
        }
    }, [dynamicState, globalEditDescriptionSignal, isOfficial, noCard]);

    return <CardPreviewContainer className={mergeClass(
        'card-preview',
        lockedData ? 'card-preview-locked' : '',
        isOfficial ? '' : 'card-preview-custom',
    )}>
        <div className="card-preview-header">
            {children}
            <div className="card-preview-image-container">
                {noCard
                    ? <CardBack size="md" className="card-preview-image" />
                    : <DelayedImage
                        className="card-preview-image"
                        type={type === 'external' ? 'URL' : 'Base64'}
                        src={type === 'external' ? dataURL : data}
                        onContextMenu={e => {
                            e.preventDefault();
                            preview('modal', 'external', dataURL, isOfficial, description);
                        }}
                    />}
            </div>
        </div>
        <div className="card-preview-description">
            {(!noCard && lockedData === undefined) && <div className="official-status">{isOfficial ? 'Official' : 'Custom'}</div>}
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
                    : <div className="card-preview-description-read" onClick={() => !isOfficial && setLockedData(dynamicState)}>
                        {description.split('\n').map((text, index) => <div key={index}>{text}</div>)}
                        {(dataURL.length > 0 && !noCard && (description ?? '').length === 0) && !isOfficial && <div>Add your description here</div>}
                    </div>}
        </div>
    </CardPreviewContainer>;
};