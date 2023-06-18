import { Input, Popover } from 'antd';
import { useState } from 'react';
import { CLASS_PREVENT_POINTER_EVENT, getCounterImage } from 'src/model';
import styled from 'styled-components';
import './counter-list.scss';

const CardCounterContainer = styled.div`
    display: inline-flex;
    flex-direction: column;
    row-gap: var(--spacing-xs);
    .counter-entry {
        display: inline-flex;
        border-radius: var(--br-max);
        overflow: hidden;
        cursor: pointer;
        .counter-icon {
            width: 1rem;
            height: 1rem;
            position: relative;
            z-index: 1;
        }
        .counter-value {
            line-height: 1;
            margin-left: -1rem;
            padding: 0 var(--spacing-sm) 0 var(--spacing-xl);
            background-color: var(--color-contrast);
            border: var(--bd);
        }
        &:hover {
            color: var(--main-antd);
        }
    }
`;
export type CardCounter = {
    counterMap?: Record<string, number>,
    onChange: (counterName: string, amount?: string) => void,
}
export const CardCounter = ({
    counterMap = {},
    onChange,
}: CardCounter) => {
    const [activeEditor, setActiveEditor] = useState<string | undefined>();

    return <CardCounterContainer className={`card-counter ${CLASS_PREVENT_POINTER_EVENT}`}>
        {Object.entries(counterMap).map(([name, value]) => {
            return <Popover key={`${name}-${activeEditor}`}
                trigger={[]}
                open={activeEditor === name}
                overlayClassName="counter-editor"
                content={<div>
                    <Input
                        autoFocus
                        size="small"
                        defaultValue={value}
                        onBlur={() => {
                            onChange(name, `${value}`);
                            setActiveEditor(undefined);
                        }}
                        onPressEnter={e => {
                            onChange(name, e.currentTarget.value);
                            setActiveEditor(undefined);
                        }}
                    />
                </div>}
            >
                <div key={name}
                    className={`counter-entry ${CLASS_PREVENT_POINTER_EVENT}`}
                    onClick={e => {
                        if (e.ctrlKey) setActiveEditor(name);
                        else onChange(name, `${value + 1}`);
                    }}
                    onContextMenu={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        onChange(name, `${value - 1}`);
                    }}
                >
                    <img className="counter-icon"
                        src={getCounterImage(name)}
                        alt={name}
                    />
                    <div className="counter-value">{value}</div>
                </div>
            </Popover>;
        })}
    </CardCounterContainer>;
};