type QueueEntry = {
    id: string,
    index: number,
}
export const createIndexQueue = (count: number) => {
    let topIndex = 0;
    let entryQueue: (QueueEntry | undefined)[] = [];
    let entryMap: Record<string, number> = {};

    for (let cnt = 0; cnt < count; cnt++) entryQueue.push(undefined);

    /**
     * Dồn toa entry
     * [1, x, x, 4, 5, 6, x, 8, x, x, x, 12]
     * => [1, 2, 3, 4, 5, 6, x, x, x, x, x, x]
     */
    const prune = () => {
        let newEntryMap: Record<string, number> = {};
        let newEntryQueue: (QueueEntry | undefined)[] = [];
        let existCount = 0;
        let nonExistCount = 0;
        for (let cnt = 0; cnt < count; cnt++) {
            const target = entryQueue[cnt];
            /** Nếu là phần tử có tồn tại, ta dồn nó vào đầu array mới, nếu không ta dồn nó ra sau */
            if (target !== undefined) {
                newEntryQueue[existCount] = { id: target.id, index: existCount };
                newEntryMap[target.id] = existCount;
                console.log('🚀 ~ file: index-queue.tsx:24 ~ prune ~ target', newEntryQueue.map(entry => `${entry?.id ?? ''}-${entry?.index ?? ''}`), newEntryMap);
                existCount += 1;
            } else {
                newEntryQueue[count - 1 - nonExistCount] = undefined;
                nonExistCount += 1;
            }
        }

        entryMap = newEntryMap;
        entryQueue = newEntryQueue;
        topIndex = existCount;
        console.log('🚀 ~ file: index-queue.tsx:37 ~ prune ~ newEntryQueue', newEntryMap, newEntryQueue, existCount);
    };

    return {
        getQueue: () => entryQueue,
        searchIndex: (id: string) => entryMap[id],
        toTop: (id: string) => {
            let pruned = false;
            if (topIndex === count) {
                prune();
                pruned = true;
            }

            const targetIndex = entryMap[id] ?? -1;

            const newIndex = topIndex;
            if (targetIndex >= 0) {
                entryQueue[targetIndex] = undefined;
            }
            entryQueue[newIndex] = { id, index: newIndex };
            entryMap[id] = newIndex;
            topIndex += 1;

            console.log(entryQueue.map(entry => `${entry?.id ?? ''}-${entry?.index ?? ''}`), pruned);

            return pruned;
        },
    };
};