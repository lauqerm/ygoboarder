import { CardPoolToBitMap, YGOProCard } from 'src/model';
import { YGOProPayloadStatKey, YGOProRequestorPayload, YGOProStatPayload } from 'src/state';

export const YGOProRequestor = async (
    payload: YGOProRequestorPayload | undefined,
    cardList: YGOProCard[],
    cardPoolList: string[],
    banlist: string,
) => {
    if (!payload) return cardList;
    const cardPoolValue = cardPoolList.reduce((acc, cur) => acc | CardPoolToBitMap[cur], 0);
    let filterMap: Record<string, (value: YGOProCard) => boolean> = {
        pool: card => (card.pool_binary | cardPoolValue) === cardPoolValue,
    };
    const processStatPayload = (statPayload: YGOProStatPayload, statType: YGOProPayloadStatKey = 'atk') => {
        const {
            firstOperator, firstValue, secondOperator, secondValue,
            question, regex,
        } = statPayload;
        const explicitOperatorSearchBuilder = (operator: string, compareValue: number) => {
            switch (operator) {
            case 'lt': return (value: YGOProCard) => (value[statType] ?? 0) < compareValue;
            case 'lte': return (value: YGOProCard) => (value[statType] ?? 0) <= compareValue;
            case 'gt': return (value: YGOProCard) => (value[statType] ?? Infinity) > compareValue;
            case 'gte': return (value: YGOProCard) => (value[statType] ?? Infinity) >= compareValue;
            case 'qt': return (value: YGOProCard) => ((value.misc_info as any)[`question_${statType}`] ?? 0) === 1;
            }
            return (_: YGOProCard) => true;
        };
        let firstValueSearcher = (_: YGOProCard) => true;
        /** Search đích danh cho chỉ số không xác định */
        if (question) {
            return filterMap[statType] = entry => ((entry.misc_info?.[0] as any)[`question_${statType}`] ?? 0) === 1;
        } else if (regex) {
            console.log('🚀 ~ file: ygopro-importer-requestor.ts:35 ~ processStatPayload ~ regex:', regex);
            /** Search bằng regex */
            return filterMap[statType] = entry => regex.test(`${entry[statType]}`);
        } else {
            /** Nếu tồn tại 2 value, 2 phép search này lấy phần giao */
            if (typeof firstValue === 'number') {
                if (firstOperator) {
                    firstValueSearcher = explicitOperatorSearchBuilder(firstOperator, firstValue);
                } else {
                    firstValueSearcher = value => (value[statType] ?? Infinity) >= firstValue;
                }
            }
            let secondValueSearcher = (_: YGOProCard) => true;
            if (typeof secondValue === 'number') {
                if (secondOperator) {
                    secondValueSearcher = explicitOperatorSearchBuilder(secondOperator, secondValue);
                } else {
                    secondValueSearcher = value => (value[statType] ?? 0) <= secondValue;
                }
            }
            /** Nếu chỉ tồn tại đúng 1 value và không quy định operator, ta tự suy thành operator = thay vì operator >= */
            if (typeof firstValue === 'number' && !firstOperator && typeof secondValue !== 'number') {
                firstValueSearcher = value => (value[statType] ?? Infinity) === firstValue;
            }
            filterMap[statType] = entry => firstValueSearcher(entry) && secondValueSearcher(entry);
        }
        /** Mặc định search dạng monster */
        filterMap['card_type'] = entry => entry.card_type === 'monster';
    };

    const {
        limit,
        name = '', desc = '', pendDesc = '',
        atk, def, step, scale,
        card_type, attribute,
        marker, race, ability, frame, st_race,
    } = payload;

    /** Trường hợp đặc biệt với text search, name, description và pendulum description là phép search lấy phần hợp */
    if (name !== '' || desc !== '' || pendDesc !== '') {
        /** Đối với text search dạng regex:
         * * Biến các ký tự wildcard * thành match all `.*`
         * * Biến ký tự | thành match fullword (kết thúc không phải bằng chữ a-zA-Z0-9) `\W`
         */
        const regexFromText = (text: string) => {
            if (text.includes('*') || text.includes('|')) return new RegExp(name.replaceAll('*', '.*').replaceAll('|', '(\\W|$)'));
            return undefined;
        };
        let nameFilterPart = (_: YGOProCard) => false;
        if (name.length > 0) {
            const nameRegex = regexFromText(name);
            nameFilterPart = nameRegex
                ? (entry: YGOProCard) => nameRegex.test(entry.filterable_name)
                : (entry: YGOProCard) => entry.filterable_name.includes(name);
        }
        let descFilterPart = (_: YGOProCard) => false;
        if (desc.length > 0) {
            const descRegex = regexFromText(desc);
            descFilterPart = descRegex
                ? (entry: YGOProCard) => descRegex.test(entry.filterable_card_eff)
                : (entry: YGOProCard) => entry.filterable_card_eff.includes(desc);
        }
        let pendDescFilterPart = (_: YGOProCard) => false;
        if (pendDesc.length > 0) {
            const pendDescRegex = regexFromText(pendDesc);
            pendDescFilterPart = pendDescRegex
                ? (entry: YGOProCard) => pendDescRegex.test(entry.filterable_pend_eff)
                : (entry: YGOProCard) => entry.filterable_pend_eff.includes(desc);
        }

        filterMap['text'] = entry => nameFilterPart(entry)
            || descFilterPart(entry)
            || pendDescFilterPart(entry);
    }

    if (Array.isArray(limit)) {
        filterMap['limit'] = entry => limit.includes(((entry.limit_info ?? {}) as any)[`${banlist}`]);
    }

    if (step) processStatPayload(step, 'step');
    if (atk) processStatPayload(atk, 'atk');
    if (def) {
        processStatPayload(def, 'def');
        /** Mặc định search monster khác link */
        filterMap['frame'] = entry => entry.frameType !== 'link';
    }
    if (scale) {
        processStatPayload(scale, 'scale');
        /** Mặc định search monster pendulum */
        filterMap['is_pendulum'] = entry => entry.is_pendulum;
    }

    if (Array.isArray(card_type)) {
        filterMap['card_type'] = entry => card_type.includes(entry.card_type);
    }
    if (Array.isArray(attribute)) {
        filterMap['attribute'] = entry => attribute.includes(entry.attribute ?? '');
        /** Mặc định search monster */
        filterMap['card_type'] = entry => entry.card_type === 'monster';
    }
    /**
     * Mode "match at least": Matched item phải khớp với tất cả giá trị được cho, nhưng có thể chứa giá trị nằm ngoài giá trị được cho. Ta sẽ dùng phép OR giữa value item và value filter, nếu kết quả của phép OR bằng đúng value item thì có nghĩa là value item chứa tất cả giá trị nằm trong value filter.
     * Mode "match exactly": Matched item phải bằng đúng với giá trị được cho, ta chỉ cần dùng so sánh bằng giữa value item và value filter.
     * Mode "match at most": Matched item phải khớp với tối thiểu một giá trị được cho, và không chứa giá trị nào nằm ngoài giá trị được cho. Ta sẽ dùng phép OR giữa value item và value filter, nếu kết quả của phép OR bằng đúng value filter thì có nghĩa là tất cả value item đều nằm trong value filter. */
    if (marker) {
        const { mode, value } = marker;
        switch (mode) {
        case 'exactly': filterMap['marker'] = entry => entry.link_binary === value; break;
        case 'least': filterMap['marker'] = entry => entry.link_binary === (entry.link_binary | value); break;
        case 'most': filterMap['marker'] = entry => entry.link_binary !== 0 && value === (entry.link_binary | value); break;
        }
        /** Mặc định search monster link */
        filterMap['frame'] = entry => entry.frameType === 'link';
    }
    if (ability) {
        const { mode, value } = ability;
        switch (mode) {
        case 'exactly': filterMap['ability'] = entry => entry.ability_binary === value; break;
        case 'least': filterMap['ability'] = entry => entry.ability_binary === (entry.ability_binary | value); break;
        case 'most': filterMap['ability'] = entry => entry.ability_binary !== 0 && value === (entry.ability_binary | value); break;
        }
        /** Mặc định search monster */
        filterMap['card_type'] = entry => entry.card_type === 'monster';
    }
    if (race) {
        const { mode, value } = race;
        switch (mode) {
        case 'exactly': filterMap['race'] = entry => entry.race_binary === value; break;
        case 'least': filterMap['race'] = entry => entry.race_binary === (entry.race_binary | value); break;
        case 'most': filterMap['race'] = entry => entry.race_binary !== 0 && value === (entry.race_binary | value); break;
        }
    }
    if (st_race) {
        const { mode, value } = st_race;
        switch (mode) {
        case 'exactly': filterMap['st_race'] = entry => entry.race_binary === value; break;
        case 'least': filterMap['st_race'] = entry => entry.race_binary === (entry.race_binary | value); break;
        case 'most': filterMap['st_race'] = entry => entry.race_binary !== 0 && value === (entry.race_binary | value); break;
        }
        /** Không cần force card_type vì card_type đã được chọn trước đó */
    }
    if (frame) {
        const { mode, value } = frame;
        switch (mode) {
        case 'exactly': filterMap['frame'] = entry => entry.frame_binary === value; break;
        case 'least': filterMap['frame'] = entry => entry.frame_binary === (entry.frame_binary | value); break;
        case 'most': filterMap['frame'] = entry => entry.frame_binary !== 0 && value === (entry.frame_binary | value); break;
        }
    }

    console.log('🚀 ~ file: ygopro-importer-requestor.ts:78', cardPoolList, banlist, payload);
    console.log(cardList.slice(0, 20));
    /** Sắp xếp theo thứ tự cố định với hy vọng số lượng card sau filter giảm nhanh nhất */
    const filterList: ((_: YGOProCard) => boolean)[] = [
        filterMap['card_type'],
        filterMap['frame'],
        filterMap['pool'],
        filterMap['limit'],
        filterMap['attribute'],
        filterMap['race'],
        filterMap['st_race'],
        filterMap['is_pendulum'],
        filterMap['ability'],
        filterMap['step'],
        filterMap['atk'],
        filterMap['def'],
        filterMap['scale'],
        filterMap['marker'],
        filterMap['text'],
    ].filter(entry => entry !== undefined);
    /** Lặp qua từng filter một, kết quả của lần filter này trở thành đầu vào của lần kế tiếp */
    let inputList = cardList;
    for (let filterFunc of filterList) {
        let narrowedList = [];
        for (let cardCnt = 0; cardCnt < inputList.length; cardCnt++) {
            if (filterFunc(inputList[cardCnt])) narrowedList.push(inputList[cardCnt]);
        }
        console.log(filterFunc.toString(), [...narrowedList].slice(0, 20));
        inputList = narrowedList;
    }

    return inputList.sort((l, r) => l.name.localeCompare(r.name));
};
