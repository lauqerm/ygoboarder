import { Input } from 'antd';
import { useEffect, useState } from 'react';
import { useLPState } from 'src/state';
import { mergeClass } from 'src/util';
import styled from 'styled-components';

const LPWidgetContainer = styled.div`
    padding: var(--spacing-sm);
    .lp-block + .lp-block {
        margin-top: var(--spacing-sm);
    }
    .ant-input-group-addon {
        background-color: var(--dim-metal);
        border: var(--bd);
        padding: 0;
    }
    input.ant-input {
        padding-left: var(--spacing-sm);
        padding-right: var(--spacing-sm);
    }
    .lp-input {
        font-weight: bold;
        width: 3rem;
        padding: 0 var(--spacing-sm);
        text-transform: uppercase;
    }
    .lp-input-your {
        color: var(--main-your-color);
        background-color: var(--sub-your-color);
    }
    .lp-input-opp {
        color: var(--main-opp-color);
        background-color: var(--sub-opp-color);
    }
`;
export type LPWidget = {

}
export const LPWidget = () => {
    const lpMap = useLPState(state => state.lpMap);
    const setLP = useLPState(state => state.set);
    const [valueMap, setValueMap] = useState<Record<string, string>>({});

    useEffect(() => {
        setValueMap(curr => {
            const nextValue = { ...curr };
            Object.entries(lpMap).forEach(([key, value]) => nextValue[key] = `${value}`);

            return nextValue;
        });
    }, [lpMap]);

    return <LPWidgetContainer className="lp-widget-container">
        {Object
            .keys(lpMap)
            .map(key => {
                return <div key={key} className="lp-block">
                    <Input
                        size="small"
                        addonBefore={<div className={mergeClass('lp-input', `lp-input-${key}`)}>{key}</div>}
                        value={valueMap[key]}
                        onChange={e => setValueMap(cur => ({ ...cur, [key]: e.currentTarget.value }))}
                        onPressEnter={e => setLP(key, e.currentTarget.value)}
                    />
                </div>;
            })}
    </LPWidgetContainer>;
};