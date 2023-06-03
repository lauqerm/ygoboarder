import { Checkbox, Input, InputRef } from 'antd';
import { useRef, useState } from 'react';
import styled from 'styled-components';

const YGOProFilterContainer = styled.div`
    padding-bottom: var(--spacing);
    .text-operator-option {
        .ant-checkbox + span {
            padding: 0 var(--spacing-sm);
        }
    }
`;
export type RequestorPayload = {
    fname?: string,
    desc?: string,
}

const textOperatorList: (keyof RequestorPayload)[] = ['fname', 'desc'];
export type YGOImporterFilter = {
    onPayloadChange: (transformer: (oldPayload: RequestorPayload) => RequestorPayload) => void,
}
export const YGOImporterFilter = ({
    onPayloadChange,
}: YGOImporterFilter) => {
    const [textMode, setTextMode] = useState<(keyof RequestorPayload)[]>(['fname', 'desc']);
    const textInputRef = useRef<InputRef>(null);

    return <YGOProFilterContainer className="ygopro-filter">
        <Input.Search ref={textInputRef}
            size="small"
            allowClear
            addonBefore={<div className="text-operator-option">
                <Checkbox.Group
                    options={[
                        {value: 'fname', label: 'Name' },
                        {value: 'desc', label: 'Effect' },
                    ]}
                    defaultValue={textMode}
                    onChange={valueList => {
                        setTextMode(valueList as (keyof RequestorPayload)[]);
                        textInputRef.current?.focus();
                    }}
                />
            </div>}
            onSearch={async value => {
                onPayloadChange(curr => {
                    const newPayload = { ...curr };
                    textOperatorList.forEach(operator => delete newPayload[operator]);
                    textMode.forEach(operator => newPayload[operator] = value);

                    return newPayload;
                });
            }}
            placeholder="Search card text"
        />
    </YGOProFilterContainer>;
};