import { Input, InputRef } from 'antd';
import { useRef, useState } from 'react';
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
        cursor: pointer;
        background-color: var(--dim);
        font-weight: bold;
        text-align: center;
    }
    .error-text {
        color: var(--main-danger);
    }
`;
export type RandomWidget = {

}
export const RandomWidget = () => {
    const [result, setResult] = useState(0);
    const [error, setError] = useState<null | string>(null);
    const internalValue = useRef('');
    const inputRef = useRef<InputRef>(null);
    const random = (range: number) => {
        if (range > 0) setResult(1 + Math.floor(Math.random() * range));
        else setResult(0);
    };
    const submit = (expression: string) => {
        try {
            const value = parseInt(expression);

            if (isNaN(value)) {
                setError('Invalid range');
                inputRef.current?.focus();
            }
            else random(value);
        } catch (e) {
            setError('Invalid range');
            inputRef.current?.focus();
        }
    };

    return <RandomWidgetContainer className="random-widget">
        <div className="random-button-list">
            {[2, 3, 6].map(entry => {
                return <div key={entry} className="static-random-button" onClick={() => random(entry)}>{entry}</div>;
            })}
            <Input ref={inputRef}
                size="small"
                status={typeof error === 'string' ? 'error' : undefined}
                onChange={e => {
                    internalValue.current = e.currentTarget.value;
                    setError(null);
                }}
                onPressEnter={e => submit(e.currentTarget.value)}
            />
        </div>
        <div className="random-result" onClick={() => {
            submit(internalValue.current);
        }}>
            {error
                ? <span className="error-text">{error}</span>
                : result === 0 ? 'Random' : `Result: ${result}`}
        </div>
    </RandomWidgetContainer>;
};