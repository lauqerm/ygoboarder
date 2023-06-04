import { YGOProCard } from 'src/model';
import { YGOProRequestorPayload, YGOProStatPayload } from 'src/state';

export const YGOProRequestor = async (payload: YGOProRequestorPayload | undefined, cardList: YGOProCard[]) => {
    if (!payload) return cardList;
    let filterMap: Record<string, (value: YGOProCard) => boolean> = {};
    const processStatPayload = (statPayload: YGOProStatPayload, statType: 'atk' | 'def' = 'atk') => {
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
        if (firstValue) {
            if (firstOperator) {
                firstValueSearcher = explicitOperatorSearchBuilder(firstOperator, firstValue);
            } else {
                firstValueSearcher = value => (value[statType] ?? Infinity) >= firstValue;
            }
        }
        let secondValueSearcher = (_: YGOProCard) => true;
        if (secondValue) {
            if (secondOperator) {
                secondValueSearcher = explicitOperatorSearchBuilder(secondOperator, secondValue);
            } else {
                secondValueSearcher = value => (value[statType] ?? 0) <= secondValue;
            }
        }
        /** Nếu chỉ tồn tại đúng 1 value và không quy định operator, ta tự suy thành operator = thay vì operator >= */
        if (firstValue && !firstOperator && typeof secondValue !== 'number') {
            firstValueSearcher = value => (value[statType] ?? Infinity) === firstValue;
        }
        filterMap[statType] = entry => firstValueSearcher(entry) && secondValueSearcher(entry);
        /** Mặc định search dạng monster */
        filterMap['card_type'] = entry => entry.card_type === 'monster';
        /** Mặc định search monster khác link */
        filterMap['sub_type'] = entry => entry.frameType !== 'link';
    };

    const { name, desc, atk, def, card_type } = payload;
    /** Trường hợp đặc biệt với text search, name và description là hai phép search lấy phần hợp */
    if ((typeof name === 'string' && name.length > 0) && (typeof desc === 'string' && desc.length > 0)) {
        filterMap['text'] = entry => entry.filterable_desc.includes(desc) || entry.filterable_name.includes(name);
    } else if (typeof name === 'string' && name.length > 0) {
        filterMap['text'] = entry => entry.filterable_name.includes(name);
    } else if (typeof desc === 'string' && desc.length > 0) {
        filterMap['text'] = entry => entry.filterable_desc.includes(desc);
    }

    if (atk) processStatPayload(atk, 'atk');
    if (def) processStatPayload(def, 'def');
    if (Array.isArray(card_type)) {
        filterMap['card_type'] = entry => card_type.includes(entry.card_type);
    }

    console.log('🚀 ~ file: ygopro-importer-requestor.ts:78 ~ YGOProRequestor ~ payload:', payload);
    /** Sắp xếp theo thứ tự cố định với hy vọng số lượng card sau filter giảm nhanh nhất */
    const filterList: ((_: YGOProCard) => boolean)[] = [
        filterMap['card_type'],
        filterMap['sub_type'],
        filterMap['text'],
        filterMap['atk'],
        filterMap['def'],
    ].filter(entry => entry !== undefined);
    /** Lặp qua từng filter một, kết quả của lần filter này trở thành đầu vào của lần kế tiếp */
    let inputList = cardList;
    for (let filterFunc of filterList) {
        let narrowedList = [];
        for (let cardCnt = 0; cardCnt < inputList.length; cardCnt++) {
            if (filterFunc(inputList[cardCnt])) narrowedList.push(inputList[cardCnt]);
        }
        console.log([...narrowedList].slice(0, 20));
        inputList = narrowedList;
    }

    return inputList.sort((l, r) => l.name.localeCompare(r.name));
};
