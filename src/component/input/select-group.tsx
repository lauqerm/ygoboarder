import { Select, SelectProps } from 'antd';
import { GroupPickerMode, PickerMode } from 'src/model';
import styled from 'styled-components';
import { ModePicker } from '../input';
import { useState } from 'react';
import { DefaultOptionType } from 'antd/lib/select';
import { mergeClass } from 'src/util';

const SelectGroupContainer = styled.div`
    display: flex;
    .ant-select {
        flex: 1 1 auto;
    }
    .mode-picker {
        padding-left: var(--spacing-xxs);
        border: var(--bd-antd);
        border-left: none;
        border-top-right-radius: var(--br-antd);
        border-bottom-right-radius: var(--br-antd);
    }
`;
export type SelectGroup = {
    outerClassName?: string,
    defaultPickerMode?: PickerMode,
    onChange?: (mode: PickerMode, value: any, option: DefaultOptionType | DefaultOptionType[]) => void,
}
& Omit<SelectProps, 'onChange'>
& {
    pickerModeList?: ModePicker['optionList'],
};
export const SelectGroup = ({
    outerClassName,
    defaultPickerMode = 'least',
    pickerModeList = GroupPickerMode,
    onChange,
    ...rest
}: SelectGroup) => {
    const [pickerMode, setPickerMode] = useState(defaultPickerMode);
    const [currentValue, setCurrentValue] = useState({ value: undefined as any, option: [] as DefaultOptionType | DefaultOptionType[] });
    const { disabled } = rest;

    return <SelectGroupContainer className={mergeClass(outerClassName, 'select-group')}>
        <Select
            {...rest}
            onChange={(value, option) => {
                onChange?.(pickerMode, value, option);
                setCurrentValue({ value, option });
            }}
        />
        <ModePicker
            optionList={pickerModeList}
            disabled={disabled}
            value={pickerMode}
            onChange={newMode => {
                onChange?.(newMode, currentValue.value, currentValue.option);
                setPickerMode(newMode);
            }}
        />
    </SelectGroupContainer>;
};