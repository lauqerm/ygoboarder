import { Input } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

const RandomWidgetContainer = styled.div`
    border: var(--bd);
    border-radius: var(--br);
    margin: var(--spacing-sm);
    .random-button-list {
        display: flex;
        .static-random-button {
            background-color: var(--bdColor-faint);
            padding: 0 var(--spacing);
            cursor: pointer;
            &:hover {
                background-color: var(--sub-info);
            }
        }
        .ant-input {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    }
    .random-result {
        background-color: var(--dim);
        font-weight: bold;
        text-align: center;
    }
`;
export type RandomWidget = {

}
export const RandomWidget = () => {
    const [result, setResult] = useState(0);
    const random = (range: number) => {
        if (range > 0) setResult(1 + Math.floor(Math.random() * range));
        else setResult(0);
    };

    return <RandomWidgetContainer className="random-widget">
        <div className="random-button-list">
            {[2, 3, 6].map(entry => {
                return <div key={entry} className="static-random-button" onClick={() => random(entry)}>{entry}</div>;
            })}
            <Input
                size="small"
                onPressEnter={e => {
                    try {
                        const value = parseInt(e.currentTarget.value);

                        if (isNaN(value)) random(0);
                        else random(value);
                    } catch (e) {
                        random(0);
                    }
                }}
            />
        </div>
        <div className="random-result">
            {result === 0 ? 'Random' : `Result: ${result}`}
        </div>
    </RandomWidgetContainer>;
};