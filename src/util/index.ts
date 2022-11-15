export const mergeClass = (...args: (string | undefined | null)[]) => {
    return (args ?? []).filter(Boolean).join(' ');
};