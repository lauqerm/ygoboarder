import { Tooltip } from 'antd';
import { GroupPickerMode, PickerMode } from 'src/model';
import { mergeClass } from 'src/util';
import styled from 'styled-components';

const ModePickerContainer = styled.div`
    display: flex;
    background-color: var(--contrast-antd);
    .mode-picker-button {
        font-family: monospace;
        font-weight: bold;
        color: var(--color-extraFaint);
        cursor: pointer;
        width: 1rem;
        text-align: center;
        &.active-mode {
            color: var(--main-antd);
            box-shadow: 0 0 0 1px var(--main-antd);
        }
        &:hover {
            color: var(--sub-antd);
            box-shadow: 0 0 0 1px var(--sub-antd);
        }
    }
    &.mode-picker-disabled {
        .mode-picker-button {
            cursor: not-allowed;
            color: rgba(0, 0, 0, 0.25);
            background-color: #f5f5f5;
            box-shadow: 0 0 0 1px #d9d9d9;
        }
    }
`;
export type ModePicker = {
    disabled?: boolean,
    optionList?: (typeof GroupPickerMode)[0][],
    value: PickerMode,
    onChange: (mode: PickerMode) => void,
}
export const ModePicker = ({
    disabled,
    value: selectedValue,
    optionList = GroupPickerMode,
    onChange,
}: ModePicker) => {
    return <ModePickerContainer className={mergeClass('mode-picker', disabled ? 'mode-picker-disabled' : '')}>
        {optionList.map(({ value, tooltip, label }) => {
            return <Tooltip key={value} overlay={tooltip} open={disabled ? false : undefined} placement="topRight">
                <div
                    className={mergeClass(
                        'mode-picker-button',
                        value === selectedValue ? 'active-mode' : '',
                    )}
                    onClick={() => !disabled && onChange(value)}
                >
                    {label}
                </div>
            </Tooltip>;
        })}
    </ModePickerContainer>;
};