import { Button, Checkbox, Input, InputRef, Select } from 'antd';
import { useRef, useState } from 'react';
import { YGOProPayloadStringKey, useYGOProFilter } from 'src/state';
import styled from 'styled-components';

const { Search } = Input;
type SearchProps = React.ComponentProps<typeof Search>

const YGOProFilterContainer = styled.div`
    display: flex;
    column-gap: var(--spacing);
    padding-bottom: var(--spacing);
    .first-column {
        .ant-btn {
            width: 100%;
            + .ant-btn {
                margin-top: var(--spacing-sm);
            }
        }
    }
    .second-column {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        flex: 1;
        .frame-filter {
            width: 55rem;
        }
        .second-row {
            display: flex;
            gap: var(--spacing-sm);
        }
    }
    .text-operator-option {
        .ant-checkbox + span {
            padding: 0 var(--spacing-sm);
        }
    }
`;

const textOperatorList: YGOProPayloadStringKey[] = ['name', 'desc'];

export type YGOImporterFilter = {
    id: string,
    ready: boolean
}
export const YGOImporterFilter = ({
    id,
    ready,
}: YGOImporterFilter) => {
    const [textMode, setTextMode] = useState<YGOProPayloadStringKey[]>(['name', 'desc']);
    const [cardModeList, setCardMode] = useState<('monster' | 'spell' | 'trap')[] | undefined>(undefined);
    const [filterKeyMap, setFilterKeyMap] = useState({
        text: 0,
        atk: 0,
        def: 0,
        card_type: 0,
    });
    const textInputRef = useRef<InputRef>(null);
    const internalPayload = useRef<Record<string, any>>({});
    const setPayload = useYGOProFilter(state => state.set);
    const normalizeStatValue = (value: any) => {
        if (typeof value !== 'string') return undefined;
        const normalizeValue = (value: any): [string | undefined, number | undefined] => {
            if (typeof value !== 'string') return [undefined, undefined];
            const numericPart = parseInt(value.replaceAll(/\D/gi, ''));

            if (value.startsWith('>=')) return ['gte', numericPart];
            if (value.startsWith('<=')) return ['lte', numericPart];
            if (value.startsWith('=')) return [undefined, numericPart];
            if (value.startsWith('>')) return ['gt', numericPart];
            if (value.startsWith('<')) return ['lt', numericPart];
            return [undefined, numericPart];
        };
        const trimmedValue = (value ?? '').replaceAll(' ', '');
        const [firstHalf, secondHalf] = trimmedValue.split('-');
        const [firstOperator, firstValue] = normalizeValue(firstHalf);
        const [secondOperator, secondValue] = normalizeValue(secondHalf);

        return {
            firstOperator,
            firstValue,
            secondOperator,
            secondValue,
        };
    };
    const applySearch = () => {
        setPayload(id, curr => {
            const newPayload = { ...curr };
            const { text, atk, def, card_type } = internalPayload.current;

            if (typeof text === 'string') {
                textOperatorList.forEach(operator => delete newPayload[operator]);
                textMode.forEach(operator => newPayload[operator] = text.toLocaleLowerCase());
            } else {
                newPayload['name'] = undefined;
                newPayload['desc'] = undefined;
            }
            newPayload['atk'] = normalizeStatValue(atk);
            newPayload['def'] = normalizeStatValue(def);
            newPayload['card_type'] = (card_type ?? []).length === 0 ? undefined : card_type;

            return newPayload;
        });
    };
    const resetSearch = () => {
        internalPayload.current = {};
        setPayload(id, () => ({}));
        setCardMode(undefined);
        setFilterKeyMap(cur => {
            const newKeyMap = { ...cur };
            for (let key in newKeyMap) newKeyMap[key as keyof typeof cur] += 1;

            return newKeyMap;
        });
    };

    const commonProps = {
        size: 'small' as SearchProps['size'],
        allowClear: true,
        disabled: !ready,
    };
    return <YGOProFilterContainer className="ygopro-filter">
        <div className="first-column">
            <Button size="small" disabled={!ready} type="primary" onClick={applySearch}>Search</Button>
            <Button size="small" disabled={!ready} onClick={resetSearch}>Clear</Button>
        </div>
        <div className="second-column truncate">
            <div className="first-row truncate">
                <Search ref={textInputRef} key={`text-${filterKeyMap['text']}`}
                    {...commonProps}
                    addonBefore={<div className="text-operator-option">
                        <Checkbox.Group
                            options={[
                                { value: 'name', label: 'Name' },
                                { value: 'desc', label: 'Effect' },
                            ]}
                            defaultValue={textMode}
                            onChange={valueList => {
                                setTextMode(valueList as YGOProPayloadStringKey[]);
                                textInputRef.current?.focus();
                            }}
                        />
                    </div>}
                    onChange={e => internalPayload.current['text'] = e.currentTarget.value}
                    onSearch={() => applySearch()}
                    placeholder="Search card text"
                />
            </div>
            <div className="second-row truncate">
                <Select key={`card_type-${filterKeyMap['card_type']}`}
                    {...commonProps}
                    className="frame-filter"
                    mode="multiple"
                    placeholder="Card type"
                    options={[
                        { value: 'spell', label: 'Spell' },
                        { value: 'trap', label: 'Trap' },
                        { value: 'monster', label: 'Monster' },
                    ]}
                    onChange={value => {
                        const normalizedValueList = Array.isArray(value) ? value : [value];
                        internalPayload.current['card_type'] = normalizedValueList;
                        if (normalizedValueList.length > 0 && !normalizedValueList.includes('monster')) {
                            delete internalPayload.current['atk'];
                            delete internalPayload.current['def'];
                            setFilterKeyMap(cur => ({ ...cur, atk: cur.atk + 1, def: cur.def + 1 }));
                        }
                        setCardMode(normalizedValueList);
                        applySearch();
                    }}
                />
                <Search key={`atk-${filterKeyMap['atk']}`}
                    {...commonProps}
                    addonBefore="ATK"
                    disabled={!ready || (Array.isArray(cardModeList) && !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['atk'] = e.currentTarget.value}
                    onSearch={() => applySearch()}
                />
                <Search key={`def-${filterKeyMap['def']}`}
                    {...commonProps}
                    addonBefore="DEF"
                    disabled={!ready || (Array.isArray(cardModeList) && !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['def'] = e.currentTarget.value}
                    onSearch={() => applySearch()}
                />
            </div>
        </div>
    </YGOProFilterContainer>;
};