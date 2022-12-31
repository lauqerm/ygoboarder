export const mergeClass = (...args: (string | undefined | null)[]) => {
    return (args ?? []).filter(Boolean).join(' ');
};

export const isLieInside = (point: { x: number, y: number }, rect: { top: number, left: number, right: number, bottom: number }) => {
    return (point.x >= rect.left) && (point.x <= rect.right) && (point.y >= rect.top) && (point.y <= rect.bottom);
};
