import { Button, Checkbox, Input, InputRef, Select } from 'antd';
import { useRef, useState } from 'react';
import { CheckboxGroup, LinkMarkerPicker, SelectGroup } from 'src/component/atom';
import { CardRaceList, CardRaceToBitMap, CardType, CardTypeList, GroupPickerMode, MarkerToBitMap, MonsterRaceList, PickerMode } from 'src/model';
import { YGOProPayloadStringKey, useYGOProFilter } from 'src/state';
import styled from 'styled-components';

const { Search } = Input;
type SearchProps = React.ComponentProps<typeof Search>;

const YGOProFilterContainer = styled.div`
    display: flex;
    column-gap: var(--spacing);
    padding-bottom: var(--spacing);
    .ant-input-group-addon {
        padding: 0 var(--spacing-sm);
    }
    .ant-select-selection-item {
        padding-left: var(--spacing-sm);
    }
    .ant-input-affix-wrapper {
        padding: 0 var(--spacing-xs);
        .ant-input-clear-icon-hidden {
            display: none;
        }
    }
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
            flex: 0 0 15rem;
        }
        .first-row,
        .second-row,
        .third-row {
            display: flex;
            gap: var(--spacing-sm);
        }
        .card-type-filter {
            flex: 0 0 auto;
        }
        .text-filter {
            flex: 1;
            display: flex;
            .ant-input-affix-wrapper,
            .ant-input-wrapper {
                border-left: none;
            }
            .ant-input-affix-wrapper {
                flex: 1;
                * {
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }
            }
            .ant-input-group-addon {
                padding: 0;
            }
            .checkbox-group {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }
            .ant-tag:last-child {
                border-radius: 0;
            }
        }
        .image-icon {
            flex: 0 0 85px;
            .ant-input-group-addon {
                line-height: 1;
                font-weight: bold;
                img {
                    /** antd small input height trừ cho border, margin, vv... */
                    height: 16px;
                    padding-bottom: var(--spacing-xs);
                }
            }
        }
    }
    .text-operator-option {
        .ant-checkbox + span {
            padding: 0 var(--spacing-sm);
        }
    }
    .attribute-filter {
        flex: 0 0 auto;
        .ant-tag {
            line-height: 0;
        }
        img {
            /** antd small input height trừ cho border, margin, vv... */
            height: 20px;
            padding: var(--spacing-xxs);
        }
    }
    .race-filter {
        flex: 1 1 auto;
    }
`;

const textOperatorList: YGOProPayloadStringKey[] = ['name', 'desc', 'pendDesc'];

export type YGOImporterFilter = {
    id: string,
    ready: boolean
}
export const YGOImporterFilter = ({
    id,
    ready,
}: YGOImporterFilter) => {
    const [textModeList, setTextMode] = useState<YGOProPayloadStringKey[]>([...textOperatorList]);
    const [cardModeList, setCardModeList] = useState<CardType[]>(CardTypeList);
    const [filterKeyMap, setFilterKeyMap] = useState({
        atk: 0,
        card_type: 0,
        attribute: 0,
        def: 0,
        scale: 0,
        step: 0,
        text: 0,
        marker: 0,
        race: 0,
    });
    const textInputRef = useRef<InputRef>(null);
    const internalPayload = useRef({
        text: '' as string | undefined,
        atk: '' as string | undefined,
        def: '' as string | undefined,
        step: '' as string | undefined,
        scale: '' as string | undefined,
        card_type: [] as string[] | undefined,
        attribute: [] as string[] | undefined,
        marker: undefined as { mode: PickerMode, value: number[] } | undefined,
        race: undefined as { mode: PickerMode, value: number[] } | undefined,
    });
    const setPayload = useYGOProFilter(state => state.set);
    const normalizeStatValue = (value: any) => {
        if (typeof value !== 'string' || value === '') return undefined;
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
            const {
                text,
                atk, def, step, scale,
                card_type, attribute,
                marker, race,
            } = internalPayload.current;

            if (typeof text === 'string') {
                textOperatorList.forEach(operator => delete newPayload[operator]);
                textModeList.forEach(operator => newPayload[operator] = text.toLocaleLowerCase());
            } else {
                newPayload['name'] = undefined;
                newPayload['desc'] = undefined;
                newPayload['pendDesc'] = undefined;
            }
            newPayload['atk'] = normalizeStatValue(atk);
            newPayload['def'] = normalizeStatValue(def);
            newPayload['step'] = normalizeStatValue(step);
            newPayload['scale'] = normalizeStatValue(scale);
            newPayload['attribute'] = (attribute ?? []).length === 0 ? undefined : attribute;
            newPayload['card_type'] = (card_type ?? []).length === 0 ? undefined : card_type;
            if (marker) {
                const { mode, value } = marker;

                newPayload['marker'] = { mode, value: value.reduce((acc, cur) => acc | cur, 0) };
            } else {
                newPayload['marker'] = undefined;
            }
            if (race) {
                const { mode, value } = race;

                newPayload['race'] = { mode, value: value.reduce((acc, cur) => acc | cur, 0) };
            } else {
                newPayload['race'] = undefined;
            }

            return newPayload;
        });
    };
    const resetSearch = () => {
        internalPayload.current = {
            atk: undefined,
            attribute: undefined,
            card_type: undefined,
            def: undefined,
            marker: undefined,
            race: undefined,
            scale: undefined,
            step: undefined,
            text: undefined,
        };
        setPayload(id, () => ({}));
        setCardModeList(CardTypeList);
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
                <CheckboxGroup key={`card_type-${filterKeyMap['card_type']}`}
                    {...commonProps}
                    className="card-type-filter"
                    optionList={[
                        { value: 'monster', label: 'Monster', defaultChecked: (cardModeList ?? []).includes('monster') },
                        { value: 'spell', label: 'Spell', defaultChecked: (cardModeList ?? []).includes('spell') },
                        { value: 'trap', label: 'Trap', defaultChecked: (cardModeList ?? []).includes('trap') },
                    ]}
                    onReset={() => { }}
                    onChange={value => {
                        internalPayload.current['card_type'] = value;
                        if (value.length > 0 && !value.includes('monster')) {
                            delete internalPayload.current['atk'];
                            delete internalPayload.current['attribute'];
                            delete internalPayload.current['def'];
                            delete internalPayload.current['marker'];
                            delete internalPayload.current['race'];
                            delete internalPayload.current['scale'];
                            delete internalPayload.current['step'];
                            setFilterKeyMap(cur => ({
                                ...cur,
                                atk: cur.atk + 1,
                                attribute: cur.atk + 1,
                                def: cur.def + 1,
                                marker: cur.marker + 1,
                                race: cur.race + 1,
                                scale: cur.scale + 1,
                                step: cur.step + 1,
                            }));
                        }
                        setCardModeList(value as typeof cardModeList);
                        applySearch();
                    }}
                />
                <div className="text-filter">
                    <CheckboxGroup className="text-operator-option" key={`text-category-${filterKeyMap['text']}`}
                        {...commonProps}
                        optionList={[
                            { value: 'name', label: 'Name', defaultChecked: (textModeList ?? []).includes('name') },
                            { value: 'desc', label: 'Card Eff', defaultChecked: (textModeList ?? []).includes('desc') },
                            { value: 'pendDesc', label: 'Pend Eff', defaultChecked: (textModeList ?? []).includes('pendDesc') },
                        ]}
                        onChange={valueList => {
                            setTextMode(valueList as YGOProPayloadStringKey[]);
                            textInputRef.current?.focus();
                        }}
                    />
                    <Input ref={textInputRef} key={`text-${filterKeyMap['text']}`}
                        {...commonProps}
                        autoFocus
                        onChange={e => internalPayload.current['text'] = e.currentTarget.value}
                        onPressEnter={() => applySearch()}
                        placeholder="Search card text"
                    />
                </div>
            </div>
            <div className="second-row truncate">
                <CheckboxGroup key={`attribute-${filterKeyMap['attribute']}`}
                    {...commonProps}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    className="attribute-filter"
                    optionList={[
                        'light',
                        'dark',
                        'water',
                        'fire',
                        'earth',
                        'wind',
                        'divine',
                    ].map(attribute => {
                        return {
                            value: attribute.toUpperCase(),
                            label: <img src={`${process.env.PUBLIC_URL}/asset/img/attribute/attr-${attribute}.png`} alt={`${attribute}-icon`} />,
                            defaultChecked: true,
                        };
                    })}
                    onReset={() => { }}
                    onChange={value => {
                        internalPayload.current['attribute'] = value;
                        applySearch();
                    }}
                />
                <Input key={`atk-${filterKeyMap['atk']}`}
                    {...commonProps}
                    addonBefore="ATK"
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['atk'] = e.currentTarget.value}
                    onPressEnter={() => applySearch()}
                />
                <Input key={`def-${filterKeyMap['def']}`}
                    {...commonProps}
                    addonBefore="DEF"
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['def'] = e.currentTarget.value}
                    onPressEnter={() => applySearch()}
                />
                <Input key={`step-${filterKeyMap['step']}`}
                    {...commonProps}
                    className="image-icon"
                    addonBefore={<span>
                        <img src={`${process.env.PUBLIC_URL}/asset/img/step-filter.png`} alt="step-filter-icon" />L
                    </span>}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['step'] = e.currentTarget.value}
                    onPressEnter={() => applySearch()}
                />
                <Input key={`scale-${filterKeyMap['scale']}`}
                    {...commonProps}
                    addonBefore="Scale"
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['scale'] = e.currentTarget.value}
                    onPressEnter={() => applySearch()}
                />
            </div>
            <div className="third-row truncate">
                <LinkMarkerPicker key={`marker-${filterKeyMap['marker']}`}
                    {...commonProps}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    defaultMode={PickerMode[1]}
                    onChange={(mode, value) => {
                        if (value.length > 0) {
                            internalPayload.current['marker'] = {
                                mode,
                                value: value.map(entry => MarkerToBitMap[entry]),
                            };
                        } else internalPayload.current['marker'] = undefined;
                    }}
                />
                {cardModeList.includes('monster') && <SelectGroup key={`race-${filterKeyMap['race']}`}
                    {...commonProps}
                    outerClassName="race-filter"
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    defaultPickerMode={PickerMode[2]}
                    pickerModeList={[GroupPickerMode[1], GroupPickerMode[2]]}
                    placeholder="Monster Type"
                    mode="multiple"
                    onChange={(mode, value) => {
                        if (value.length > 0) {
                            internalPayload.current['race'] = {
                                mode,
                                value: (value ?? []).map((entry: string) => CardRaceToBitMap[entry]),
                            };
                        } else internalPayload.current['race'] = undefined;
                    }}
                    options={MonsterRaceList.map(entry => ({ value: entry, label: entry }))}
                />}
            </div>
        </div>
    </YGOProFilterContainer>;
};
