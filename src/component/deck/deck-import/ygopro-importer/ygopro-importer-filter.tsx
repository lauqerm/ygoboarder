import { Button, Checkbox, Input, InputRef, Select } from 'antd';
import { useRef, useState } from 'react';
import { CheckboxGroup, LinkMarkerPicker, SelectGroup } from 'src/component/atom';
import {
    CardRaceList,
    CardRaceToBitMap,
    CardType,
    CardTypeList,
    GroupPickerMode,
    MarkerToBitMap,
    MonsterAbilitySubtypeGroup,
    MonsterAbilitySubtypeList,
    MonsterAbilitySubtypeToBitMap,
    MonsterFrameList,
    MonsterFrameToBitMap,
    MonsterRaceList,
    PickerMode,
    SpellRaceList,
    SpellTrapRaceList,
    TrapRaceList,
} from 'src/model';
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
    .filter-column {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        flex: 1;
        .filter-row {
            display: grid;
            gap: var(--spacing-sm);
            &.first-row {
                grid-template-columns: 75px 75px max-content 1fr;
            }
            &.second-row {
                grid-template-columns: max-content 4fr 4fr 3fr 3fr max-content;
            }
            &.third-row {
                grid-template-columns: max-content 5fr 4fr 5fr;
            }
        }
        .text-filter {
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
        .st-race-filter {
            flex: 1;
            text-align: center;
            .ant-tag {
                flex: 1;
            }
        }
        .image-icon {
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
        .ant-tag {
            line-height: 0;
        }
        img {
            /** antd small input height trừ cho border, margin, vv... */
            height: 20px;
            padding: var(--spacing-xxs);
        }
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
    const [cardModeList, setCardModeList] = useState<CardType[]>([]);
    const [filterKeyMap, setFilterKeyMap] = useState({
        ability: 0,
        atk: 0,
        attribute: 0,
        card_type: 0,
        def: 0,
        frame: 0,
        limit: 0,
        marker: 0,
        race: 0,
        st_race: 0,
        scale: 0,
        step: 0,
        text: 0,
    });
    const textInputRef = useRef<InputRef>(null);
    const internalPayload = useRef({
        limit: [] as string[] | undefined,
        text: '' as string | undefined,
        atk: '' as string | undefined,
        def: '' as string | undefined,
        step: '' as string | undefined,
        scale: '' as string | undefined,
        card_type: [] as string[] | undefined,
        attribute: [] as string[] | undefined,
        ability: undefined as { mode: PickerMode, value: number[] } | undefined,
        frame: undefined as { mode: PickerMode, value: number[] } | undefined,
        marker: undefined as { mode: PickerMode, value: number[] } | undefined,
        race: undefined as { mode: PickerMode, value: number[] } | undefined,
        st_race: undefined as { mode: PickerMode, value: number[] } | undefined,
    });
    const setPayload = useYGOProFilter(state => state.set);
    const normalizeStatValue = (value: any) => {
        if (typeof value !== 'string' || value === '') return undefined;
        const normalizeValue = (value: any): [string | undefined, number | undefined] => {
            if (typeof value !== 'string') return [undefined, undefined];
            const numericPart = parseInt(value.replaceAll(/\D/gi, ''));

            if (value.startsWith('?')) return ['qt', numericPart];
            if (value.startsWith('>=')) return ['gte', numericPart];
            if (value.startsWith('<=')) return ['lte', numericPart];
            if (value.startsWith('=')) return [undefined, numericPart];
            if (value.startsWith('>')) return ['gt', numericPart];
            if (value.startsWith('<')) return ['lt', numericPart];
            return [undefined, numericPart];
        };
        const trimmedValue = (value ?? '').replaceAll(' ', '');
        if (trimmedValue.includes('?')) {
            return {
                question: true,
            };
        } else if (trimmedValue.includes('|') || trimmedValue.includes('*')) {
            return {
                regex: new RegExp('^('
                    + trimmedValue
                        .replaceAll(/\*+\*/gi, '*') // *** => *
                        .replaceAll(/\*/gi, '.*') // * => .*
                    + ')$'),
            };
        }
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
                limit,
                text,
                atk, def, step, scale,
                card_type, attribute,
                marker, race, ability, frame, st_race,
            } = internalPayload.current;

            newPayload['limit'] = (limit ?? []).length > 0 ? limit?.map(value => parseInt(value)) : undefined;
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
            if (st_race) {
                const { mode, value } = st_race;

                newPayload['st_race'] = { mode, value: value.reduce((acc, cur) => acc | cur, 0) };
            } else {
                newPayload['st_race'] = undefined;
            }
            if (ability) {
                const { mode, value } = ability;

                newPayload['ability'] = { mode, value: value.reduce((acc, cur) => acc | cur, 0) };
            } else {
                newPayload['ability'] = undefined;
            }
            if (frame) {
                const { mode, value } = frame;

                newPayload['frame'] = { mode, value: value.reduce((acc, cur) => acc | cur, 0) };
            } else {
                newPayload['frame'] = undefined;
            }

            return newPayload;
        });
    };
    const resetSearch = () => {
        internalPayload.current = {
            ability: undefined,
            atk: undefined,
            attribute: undefined,
            card_type: undefined,
            def: undefined,
            frame: undefined,
            limit: undefined,
            marker: undefined,
            race: undefined,
            scale: undefined,
            st_race: undefined,
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
        <div className="filter-column truncate">
            <div className="filter-row first-row truncate">
                <Button size="small" disabled={!ready} type="primary" onClick={applySearch}>Search</Button>
                <Button size="small" disabled={!ready} onClick={resetSearch}>Clear</Button>
                <CheckboxGroup key={`card_type-${filterKeyMap['card_type']}`}
                    {...commonProps}
                    className="card-type-filter"
                    optionList={[
                        { value: 'monster', label: 'Monster' },
                        { value: 'spell', label: 'Spell' },
                        { value: 'trap', label: 'Trap' },
                    ]}
                    onReset={() => { }}
                    onChange={value => {
                        internalPayload.current['card_type'] = value;
                        if (value.length === 0 || !value.includes('monster')) {
                            delete internalPayload.current['ability'];
                            delete internalPayload.current['atk'];
                            delete internalPayload.current['attribute'];
                            delete internalPayload.current['def'];
                            delete internalPayload.current['frame'];
                            delete internalPayload.current['marker'];
                            delete internalPayload.current['race'];
                            delete internalPayload.current['scale'];
                            delete internalPayload.current['step'];
                            setFilterKeyMap(cur => ({
                                ...cur,
                                ability: cur.ability + 1,
                                atk: cur.atk + 1,
                                attribute: cur.atk + 1,
                                def: cur.def + 1,
                                frame: cur.frame + 1,
                                marker: cur.marker + 1,
                                race: cur.race + 1,
                                scale: cur.scale + 1,
                                step: cur.step + 1,
                            }));
                        }
                        if (value.length === 0 || value.includes('monster')) {
                            delete internalPayload.current['st_race'];
                            setFilterKeyMap(cur => ({
                                ...cur,
                                st_race: cur.st_race + 1,
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
            <div className="filter-row second-row truncate">
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
                    className="image-icon"
                    addonBefore={<span>
                        <img src={`${process.env.PUBLIC_URL}/asset/img/scale-icon.png`} alt="scale-icon" />
                    </span>}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    onChange={e => internalPayload.current['scale'] = e.currentTarget.value}
                    onPressEnter={() => applySearch()}
                />
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
            </div>
            <div className="filter-row third-row truncate">
                <CheckboxGroup key={`limit-${filterKeyMap['limit']}`}
                    {...commonProps}
                    className="card-limit-filter"
                    optionList={[
                        { value: '0', label: <span style={{ color: '#ff0000', fontWeight: 'bold' }}>0</span> },
                        { value: '1', label: <span style={{ color: '#ee6600', fontWeight: 'bold' }}>1</span> },
                        { value: '2', label: <span style={{ color: '#eeaa00', fontWeight: 'bold' }}>2</span> },
                        { value: '3', label: <span style={{ color: '#00bb00', fontWeight: 'bold' }}>3</span> },
                    ]}
                    onReset={() => { }}
                    onChange={value => {
                        internalPayload.current['limit'] = value;
                        applySearch();
                    }}
                />
                <Select key={`race-${filterKeyMap['race']}`}
                    {...commonProps}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    listHeight={384}
                    virtual={false}
                    maxTagCount={1}
                    placeholder="Monster Type"
                    mode="multiple"
                    onChange={value => {
                        if (Array.isArray(value) && value.length > 0) {
                            internalPayload.current['race'] = {
                                mode: 'most',
                                value: (value ?? []).map((entry: string) => CardRaceToBitMap[entry]),
                            };
                        } else internalPayload.current['race'] = undefined;
                    }}
                    options={MonsterRaceList.map(entry => ({ value: entry, label: entry }))}
                />
                <Select key={`frame-${filterKeyMap['frame']}`}
                    {...commonProps}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    virtual={false}
                    maxTagCount={1}
                    placeholder="Monster Card Type"
                    mode="multiple"
                    onChange={value => {
                        if (Array.isArray(value) && value.length > 0) {
                            internalPayload.current['frame'] = {
                                mode: 'most',
                                value: (value ?? []).map((entry: string) => MonsterFrameToBitMap[entry]),
                            };
                        } else internalPayload.current['frame'] = undefined;
                    }}
                    options={MonsterFrameList.map(entry => ({ value: entry, label: entry.charAt(0).toUpperCase() + entry.toLowerCase().slice(1) }))}
                />
                <SelectGroup key={`ability-${filterKeyMap['ability']}`}
                    {...commonProps}
                    disabled={!ready || (cardModeList.length === 0 || !cardModeList.includes('monster'))}
                    listHeight={384}
                    virtual={false}
                    maxTagCount={'responsive'}
                    placeholder="Ability / Subtype"
                    mode="multiple"
                    defaultPickerMode="least"
                    onChange={(mode, value) => {
                        if (Array.isArray(value) && value.length > 0) {
                            internalPayload.current['ability'] = {
                                mode,
                                value: (value ?? []).map((entry: string) => MonsterAbilitySubtypeToBitMap[entry]),
                            };
                        } else internalPayload.current['ability'] = undefined;
                    }}
                    options={Object
                        .entries(MonsterAbilitySubtypeGroup)
                        .map(([name, list]) => {
                            return {
                                label: name,
                                options: list.map(entry => ({ value: entry, label: entry })),
                            };
                        })}
                />
            </div>
            <div className="filter-row fourth-row truncate">
                <CheckboxGroup key={`race-spell-${filterKeyMap['st_race']}`}
                    {...commonProps}
                    disabled={!ready || cardModeList.length === 0 || cardModeList.includes('monster')}
                    className="st-race-filter"
                    optionList={SpellTrapRaceList.map(entry => ({
                        value: entry,
                        label: entry.toUpperCase(),
                        disabled: (cardModeList.includes('spell') && !SpellRaceList.includes(entry))
                        || (cardModeList.includes('trap') && !TrapRaceList.includes(entry)),
                    }))}
                    onReset={() => { }}
                    onChange={value => {
                        if (Array.isArray(value) && value.length > 0) {
                            internalPayload.current['st_race'] = {
                                mode: 'most',
                                value: (value ?? []).map((entry: string) => CardRaceToBitMap[entry]),
                            };
                        } else internalPayload.current['st_race'] = undefined;
                        applySearch();
                    }}
                />
            </div>
        </div>
    </YGOProFilterContainer>;
};
