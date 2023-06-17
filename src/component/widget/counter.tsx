import { Button } from 'antd';
import { getCounterImage } from 'src/model';
import { useCounterState } from 'src/state';
import styled from 'styled-components';

const CounterWidgetContainer = styled.div`
    position: relative;
    padding: var(--spacing-xs);
    .counter-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        padding: var(--spacing-xs);
    }
    .counter-icon {
        display: inline-block;
        line-height: 0;
        cursor: pointer;
        border-radius: var(--br-max);
        &:hover {
            outline: 2px solid var(--main-antd);
        }
        img {
            width: 20px;
            height: 20px;
        }
    }
`;
export const CounterWidget = () => {
    const switchCounterMode = useCounterState(state => state.setCounterMode);
    const activeCounter = useCounterState(state => state.activeCounter);

    return <CounterWidgetContainer>
        <div className="counter-list">
            {[
                { value: 'generic', label: 'Generic Counter' },
                { value: 'level', label: 'Level Counter' },
                { value: 'atk', label: 'ATK Counter' },
                { value: 'def', label: 'DEF Counter' },
                { value: 'spell', label: 'Spell Counter' },
                { value: 'venom', label: 'Venom Counter' },
                { value: 'predator', label: 'Predator Counter' },
            ].map(({ label, value }) => {
                return <div key={value} className="counter-icon" onClick={() => switchCounterMode(value)}>
                    <img src={getCounterImage(value)} alt={label} />
                </div>;
            })}
        </div>
        {activeCounter && <Button
            className="counter-off-button"
            size="small"
            onClick={() => switchCounterMode(undefined)}
            type="primary"
            danger
        >
            {'Counter mode off'}
        </Button>}
    </CounterWidgetContainer>;
};