export function serializeXYWH(x, y, w, h) {
    return `[${x},${y},${w},${h}]`;
}
export function deserializeXYWH(xywh) {
    try {
        return JSON.parse(xywh);
    }
    catch (e) {
        console.error('Failed to deserialize xywh', xywh);
        console.error(e);
        return [0, 0, 0, 0];
    }
}
//# sourceMappingURL=xywh.js.map