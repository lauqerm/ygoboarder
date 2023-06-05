import { Popover } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import { CloseCircleFilled } from '@ant-design/icons';
import { mergeClass } from 'src/util';
import { PickerMode } from 'src/model';
import { ModePicker } from '../mode-picker';
import './marker-picker.scss';

const markerBoxSize = 24;
const markerBoxSizeSmall = 6;
const LinkMarkerPickerContainer = styled.div`
    --marker-size: ${markerBoxSize}px;
    --marker-size-small: ${markerBoxSizeSmall}px;
    display: inline-flex;
    border-radius: var(--br-antd);
    border: var(--bd-antd);
    background-color: var(--contrast-antd);
    .title {
        display: flex;
        cursor: pointer;
        .title-content {
            padding: 0 var(--spacing-sm);
        }
    }
    .link-marker-reset {
        cursor: pointer;
        color: var(--color-extraFaint);
        padding: 0 var(--spacing-sm);
        color: var(--color-ghost);
        background-color: var(--main-contrast);
        font-size: var(--fs-xs);
        &:hover {
            color: var(--color-faint);
        }
    }
    .link-marker-preview {
        display: inline-grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        gap: var(--bdSize);
        background-color: var(--bdColor-antd);
        outline: var(--bdSize) solid var(--bdColor-antd);
        width: calc(3 * var(--marker-size-small) + 4px);
        height: calc(3 * var(--marker-size-small) + 4px);
        margin: 0 var(--spacing-xs);
        border: var(--bd-antd);
        .marker-preview {
            background-color: var(--contrast-antd);
        }
        .preview-shadow {
            background-color: var(--sub-metal);
        }
        .preview-on {
            background-color: var(--main-antd);
        }
    }
    &.link-marker-disabled {
        &,
        .title,
        .link-marker-reset {
            cursor: not-allowed;
            color: rgba(0, 0, 0, 0.25);
            background-color: #f5f5f5;
            box-shadow: 0 0 0 1px #d9d9d9;
        }
    }
`;

export type LinkMarkerPicker = {
    disabled?: boolean,
    defaultMode: PickerMode,
    defaultValue?: string[],
    onChange?: (mode: PickerMode, value: string[]) => void,
};
export const LinkMarkerPicker = ({
    disabled,
    defaultMode = 'exactly',
    defaultValue = [],
    onChange = () => { },
}: LinkMarkerPicker) => {
    const [expand, setExpand] = useState(false);
    const [selectedMarkerList, setSelectedMarkerList] = useState({
        mode: defaultMode,
        draft: defaultValue,
        finalized: defaultValue,
    });
    const rotateList = [-45, 0, 45, -90, 0, 90, -135, 180, 135];
    const internalOnChange = (mode: PickerMode, value: string[]) => {
        console.log(mode, value);
        const indexToArrowMap: Record<string, string> = {
            '1': 'Top-Left',
            '2': 'Top',
            '3': 'Top-Right',
            '4': 'Left',
            '6': 'Right',
            '7': 'Bottom-Left',
            '8': 'Bottom',
            '9': 'Bottom-Right',
        };
        onChange(mode, value.map(arrowIndex => indexToArrowMap[arrowIndex]));
    };

    return <LinkMarkerPickerContainer className={mergeClass('link-marker-chooser', disabled ? 'link-marker-disabled' : '')}>
        <Popover
            open={disabled ? false : expand}
            overlayClassName="marker-picker-overlay"
            overlayStyle={{
                '--marker-size': `${markerBoxSize}px`,
            } as any}
            content={<div className="marker-container">
                {rotateList.map((roratingAngle, index) => {
                    const normalizedIndex = `${index + 1}`;

                    if (normalizedIndex === '5') return <div key="5"
                        className="link-marker-accept"
                        onClick={() => {
                            internalOnChange(selectedMarkerList.mode, selectedMarkerList.draft);
                            setSelectedMarkerList(cur => ({
                                mode: cur.mode,
                                draft: cur.draft,
                                finalized: cur.draft,
                            }));
                            setExpand(false);
                        }}
                    >
                        {'OK'}
                    </div>;

                    return <div key={normalizedIndex}
                        className={mergeClass(
                            'link-marker-button',
                            `marker-${index + 1}`,
                            selectedMarkerList.draft.includes(normalizedIndex) ? 'marker-checked' : '',
                        )}
                        onClick={() => {
                            setSelectedMarkerList(cur => {
                                let newDraftMap = [...cur.draft];

                                if (newDraftMap.includes(normalizedIndex)) newDraftMap = newDraftMap.filter(entry => entry !== normalizedIndex);
                                else newDraftMap.push(normalizedIndex);

                                return {
                                    ...cur,
                                    draft: newDraftMap,
                                };
                            });
                        }}
                    >
                        <div
                            className={`link-marker-icon link-marker-icon-${index + 1}`}
                            style={{ transform: `rotate(${roratingAngle}deg) translateY(-2px)` }}
                        />
                    </div>;
                })}
            </div>}
        >
            <div className="title" onClick={() => {
                setExpand(cur => {
                    const newStatus = !cur;
                    if (newStatus === false) setSelectedMarkerList(cur => ({
                        mode: cur.mode,
                        draft: cur.finalized,
                        finalized: cur.finalized,
                    }));

                    return newStatus;
                });
            }}>
                <div className="title-content">
                    Arrows
                </div>
                <div className="link-marker-preview">
                    {rotateList.map((_, index) => {
                        const normalizedIndex = `${index + 1}`;

                        return <div key={index}
                            className={mergeClass(
                                'marker-preview',
                                normalizedIndex === '5' ? 'preview-shadow' : '',
                                selectedMarkerList.finalized.includes(normalizedIndex) ? 'preview-on' : '',
                            )}
                        />;
                    })}
                </div>
            </div>
        </Popover>
        <ModePicker
            disabled={disabled}
            value={selectedMarkerList.mode}
            onChange={mode => {
                setSelectedMarkerList(cur => ({ ...cur, mode }));
                internalOnChange(mode, selectedMarkerList.finalized);
            }}
        />
        <div
            className="link-marker-reset"
            onClick={() => {
                setSelectedMarkerList(cur => ({
                    mode: cur.mode,
                    draft: [],
                    finalized: [],
                }));
                internalOnChange(selectedMarkerList.mode, []);
            }}
        >
            <CloseCircleFilled />
        </div>
    </LinkMarkerPickerContainer>;
};