import { Popover } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import { CloseCircleFilled } from '@ant-design/icons';
import { mergeClass } from 'src/util';
import { PickerMode } from 'src/model';
import { ModePicker } from '../../input';
import './marker-picker.scss';

const markerBoxSize = 24;
const markerBoxSizeSmall = 6;
const LinkMarkerPickerContainer = styled.div`
    --marker-size: ${markerBoxSize}px;
    --marker-size-small: ${markerBoxSizeSmall}px;
    display: inline-flex;
    background-color: var(--contrast-antd);
    &.has-value {
        .title {
            .link-marker-preview,
            .title-content {
                border-color: var(--main-antd);
            }
        }
    }
    .title {
        display: flex;
        cursor: pointer;
        .title-content {
            border-radius: var(--br-antd) 0 0 var(--br-antd);
            border: var(--bd-antd);
            border-right: none;
            padding: 0 var(--spacing-sm);
        }
        &:hover {
            color: var(--sub-antd);
            .title-content {
                border-color: var(--main-antd);
            }
            .link-marker-preview {
                outline: var(--bdSize) solid var(--sub-antd);
            }
        }
    }
    .mode-picker {
        border-top: var(--bd-antd);
        border-bottom: var(--bd-antd);
        padding-right: var(--bdSize);
    }
    .link-marker-reset {
        cursor: pointer;
        color: var(--color-extraFaint);
        padding: 0 var(--spacing-sm);
        color: var(--color-ghost);
        background-color: var(--main-contrast);
        font-size: var(--fs-xs);
        border: var(--bd-antd);
        border-left: none;
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
        border: 2px solid var(--bdColor-antd);
        width: calc(2px + 3 * var(--marker-size-small) + 4px);
        height: calc(2px + 3 * var(--marker-size-small) + 4px);
        .marker-preview {
            background-color: var(--contrast-antd);
        }
        .preview-shadow {
            background-color: var(--sub-metal);
        }
        .preview-on {
            background-color: var(--main-danger);
        }
    }
    &.link-marker-disabled {
        &,
        .title,
        .link-marker-reset {
            cursor: not-allowed;
            color: rgba(0, 0, 0, 0.25);
            background-color: var(--sub-disabled);
            box-shadow: 0 0 0 1px var(--main-disabled);
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

    return <LinkMarkerPickerContainer className={mergeClass(
        'link-marker-chooser',
        disabled ? 'link-marker-disabled' : '',
        selectedMarkerList.finalized.length > 0 ? 'has-value' : '',
    )}>
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