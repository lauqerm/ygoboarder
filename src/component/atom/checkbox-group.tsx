import { Tag } from 'antd';
import styled from 'styled-components';
import { ClearOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { CardTypeList } from 'src/model';
import { mergeClass } from 'src/util';

const CheckboxGroupContainer = styled.div`
    display: inline-flex;
    border-radius: var(--br-antd);
    overflow: hidden;
    align-items: center;
    padding: var(--bdSize);
    column-gap: var(--bdSize);
    .clear-button {
        cursor: pointer;
        margin: -1px 0;
        padding: 3px var(--spacing-xs);
        border: var(--bd-antd);
        border-left: none;
        border-radius: 0 var(--br-antd) var(--br-antd) 0;
        font-size: var(--fs);
        color: var(--color-extraFaint);
        background-color: var(--main-contrast);
        &:hover {
            color: var(--sub-danger);
        }
    }
    .ant-tag {
        margin: 0;
        border-radius: 0;
        border-color: transparent;
        user-select: none;
        box-shadow: 0 0 0 1px var(--bdColor-antd);
        padding: 0 var(--spacing-sm);
        background-color: var(--main-contrast);
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
            background-color: #f5f5f5;
            box-shadow: 0 0 0 1px #d9d9d9;
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
    disabled = true,
    onChange,
    onReset,
}: CheckboxGroup) => {
    const [internalValue, setInternalValue] = useState<Record<string, boolean>>(
        optionList.reduce((map, { value, defaultChecked }) => {
            if (defaultChecked !== true) return map;
            return { ...map, [value]: defaultChecked };
        }, {} as Record<string, boolean>),
    );

    return <CheckboxGroupContainer className={mergeClass('checkbox-group', className)}>
        {(optionList ?? []).map(entry => {
            const { label, value, disabled: individualDisabled = disabled } = entry;

            return <Tag.CheckableTag key={value}
                className={individualDisabled ? 'checkbox-disabled' : ''}
                checked={internalValue[value]}
                onChange={status => {
                    if (!individualDisabled) setInternalValue(cur => {
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
        {onReset && <ClearOutlined className="clear-button" onClick={() => {
            setInternalValue(CardTypeList.reduce((map, value) => {
                return { ...map, [value]: true };
            }, {} as Record<string, boolean>));
            onChange(CardTypeList);
            onReset?.();
        }} />}
    </CheckboxGroupContainer>;
};