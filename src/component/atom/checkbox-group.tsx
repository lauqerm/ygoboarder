import { Tag, Tooltip } from 'antd';
import styled from 'styled-components';
import { CloseCircleFilled, CheckSquareFilled } from '@ant-design/icons';
import { useState } from 'react';
import { mergeClass } from 'src/util';

const CheckboxGroupContainer = styled.div`
    display: inline-flex;
    border-radius: var(--br-antd);
    overflow: hidden;
    align-items: center;
    padding: var(--bdSize);
    column-gap: var(--bdSize);
    .action-button {
        cursor: pointer;
        margin: -1px 0;
        padding: 5px var(--spacing-sm);
        border: var(--bd-antd);
        border-left: none;
        border-radius: 0 var(--br-antd) var(--br-antd) 0;
        color: var(--color-ghost);
        background-color: var(--main-contrast);
        font-size: var(--fs-xs);
        &:hover {
            color: var(--color-faint);
        }
    }
    .check-all-button {
        color: var(--color-extraFaint);
    }
    &.has-value {
        .ant-select-selector {
            border-color: var(--main-antd);
        }
    }
    &.checkbox-all-selected {
        .action-button {
            border-color: var(--main-antd);
        }
    }
    &.checkbox-group-disabled {
        .action-button {
            color: var(--color-ghost);
            border-color: var(--bdColor-antd);
            cursor: not-allowed;
            background-color: var(--sub-disabled);
            &:hover {
                color: var(--color-ghost);
            }
        }
    }
    .ant-tag {
        margin: 0;
        border-radius: 0;
        border-color: transparent;
        user-select: none;
        box-shadow: 0 0 0 1px var(--bdColor-antd);
        padding: 0 var(--spacing-xs);
        background-color: var(--main-contrast);
        font-weight: normal;
        &:first-child {
            border-radius: var(--br-antd) 0 0 var(--br-antd);
        }
        &:last-child {
            border-radius: 0 var(--br-antd) var(--br-antd) 0;
        }
        &.ant-tag-checkable-checked {
            color: var(--main-antd);
            box-shadow: 0 0 0 1px var(--main-antd);
            background-color: var(--main-contrast);
            z-index: 1;
        }
        &:hover {
            color: var(--sub-antd);
            box-shadow: 0 0 0 1px var(--sub-antd);
            z-index: 2;
        }
        &.ant-tag-checkable-checked.checkbox-disabled,
        &.checkbox-disabled {
            cursor: not-allowed;
            color: rgba(0, 0, 0, 0.25);
            background-color: var(--sub-disabled);
            box-shadow: 0 0 0 1px var(--main-disabled);
        }
    }
`;
export type CheckboxGroup = {
    className?: string,
    optionList: { value: string, label: React.ReactNode, defaultChecked?: boolean, disabled?: boolean }[],
    onChange: (selectedList: string[]) => void,
    onReset?: () => void,
    disabled?: boolean,
}
export const CheckboxGroup = ({
    className,
    optionList,
    disabled,
    onChange,
    onReset,
}: CheckboxGroup) => {
    const [internalValue, setInternalValue] = useState<Record<string, boolean>>(
        optionList.reduce((map, { value, defaultChecked }) => {
            if (defaultChecked !== true) return map;
            return { ...map, [value]: defaultChecked };
        }, {} as Record<string, boolean>),
    );

    return <CheckboxGroupContainer
        className={mergeClass(
            'checkbox-group',
            className,
            disabled ? 'checkbox-group-disabled' : '',
            optionList.length === Object.keys(internalValue).length ? 'checkbox-all-selected' : '',
            Object.keys(internalValue).length > 0 ? 'has-value' : '',
        )}
    >
        {(optionList ?? []).map(entry => {
            const { label, value, disabled: individualDisabled } = entry;
            const combinedDisable = disabled === true
                ? true
                : individualDisabled;

            return <Tag.CheckableTag key={value}
                className={combinedDisable ? 'checkbox-disabled' : ''}
                checked={internalValue[value]}
                onChange={status => {
                    if (!combinedDisable) setInternalValue(cur => {
                        const newMap = { ...cur };
                        if (status) newMap[value] = status;
                        else delete newMap[value];
                        onChange(Object.keys(newMap));

                        return newMap;
                    });
                }}
            >
                {label}
            </Tag.CheckableTag>;
        })}
        {onReset && <>
            {Object.keys(internalValue).length > 0
                ? <Tooltip overlay={disabled ? undefined : 'Clear'} placement="topRight">
                    <CloseCircleFilled className="action-button clear-button" onClick={() => {
                        if (!disabled) {
                            setInternalValue({});
                            onChange([]);
                        }
                    }} />
                </Tooltip>
                : <Tooltip overlay={disabled ? undefined : 'Select All'} placement="topRight">
                    <CheckSquareFilled className="action-button check-all-button" onClick={() => {
                        if (!disabled) {
                            setInternalValue(optionList.reduce((map, { value }) => {
                                return { ...map, [value]: true };
                            }, {} as Record<string, boolean>));
                            onChange(optionList.map(entry => entry.value));
                        }
                    }} />
                </Tooltip>}
        </>}
    </CheckboxGroupContainer>;
};