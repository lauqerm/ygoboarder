import { YGOProCard } from 'src/model';
import { YGOProPayloadStatKey, YGOProRequestorPayload, YGOProStatPayload } from 'src/state';

export const YGOProRequestor = async (payload: YGOProRequestorPayload | undefined, cardList: YGOProCard[]) => {
    if (!payload) return cardList;
    let filterMap: Record<string, (value: YGOProCard) => boolean> = {};
    const processStatPayload = (statPayload: YGOProStatPayload, statType: YGOProPayloadStatKey = 'atk') => {
        const { firstOperator, firstValue, secondOperator, secondValue } = statPayload;
        const explicitOperatorSearchBuilder = (operator: string, compareValue: number) => {
            switch (operator) {
            case 'lt': return (value: YGOProCard) => (value[statType] ?? 0) < compareValue;
            case 'lte': return (value: YGOProCard) => (value[statType] ?? 0) <= compareValue;
            case 'gt': return (value: YGOProCard) => (value[statType] ?? Infinity) > compareValue;
            case 'gte': return (value: YGOProCard) => (value[statType] ?? Infinity) >= compareValue;
            }
            return (_: YGOProCard) => true;
        };
        /** Nếu tồn tại 2 value, 2 phép search này lấy phần giao */
        let firstValueSearcher = (_: YGOProCard) => true;
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
        /** Mặc định search dạng monster */
        filterMap['card_type'] = entry => entry.card_type === 'monster';
    };

    const {
        name = '', desc = '', pendDesc = '',
        atk, def, step, scale,
        card_type,
    } = payload;
    /** Trường hợp đặc biệt với text search, name, description và pendulum description là phép search lấy phần hợp */
    if (name !== '' || desc !== '' || pendDesc !== '') {
        let nameFilterPart = (_: YGOProCard) => false;
        if (name.length > 0) nameFilterPart = (entry: YGOProCard) => entry.filterable_name.includes(name);
        let descFilterPart = (_: YGOProCard) => false;
        if (desc.length > 0) descFilterPart = (entry: YGOProCard) => entry.filterable_card_eff.includes(desc);
        let pendDescFilterPart = (_: YGOProCard) => false;
        if (pendDesc.length > 0) pendDescFilterPart = (entry: YGOProCard) => entry.filterable_pend_eff.includes(pendDesc);

        filterMap['text'] = entry => nameFilterPart(entry)
            || descFilterPart(entry)
            || pendDescFilterPart(entry);
    }

    if (step) processStatPayload(step, 'step');
    if (atk) processStatPayload(atk, 'atk');
    if (def) {
        processStatPayload(def, 'def');
        /** Mặc định search monster khác link */
        filterMap['sub_type'] = entry => entry.frameType !== 'link';
    }
    if (scale) {
        processStatPayload(scale, 'scale');
        /** Mặc định search monster pendulum */
        filterMap['is_pendulum'] = entry => entry.is_pendulum;
    }

    if (Array.isArray(card_type)) {
        filterMap['card_type'] = entry => card_type.includes(entry.card_type);
    }

    console.log('🚀 ~ file: ygopro-importer-requestor.ts:78 ~ YGOProRequestor ~ payload:', payload);
    /** Sắp xếp theo thứ tự cố định với hy vọng số lượng card sau filter giảm nhanh nhất */
    const filterList: ((_: YGOProCard) => boolean)[] = [
        filterMap['card_type'],
        filterMap['sub_type'],
        filterMap['is_pendulum'],
        filterMap['text'],
        filterMap['step'],
        filterMap['atk'],
        filterMap['def'],
        filterMap['scale'],
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
