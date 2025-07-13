/**
 * XYWH represents the x, y, width, and height of an element or block.
 */
export type XYWH = [number, number, number, number];
/**
 * SerializedXYWH is a string that represents the x, y, width, and height of a block.
 */
export type SerializedXYWH = `[${number},${number},${number},${number}]`;
export declare function serializeXYWH(x: number, y: number, w: number, h: number): SerializedXYWH;
export declare function deserializeXYWH(xywh: string): XYWH;
//# sourceMappingURL=xywh.d.ts.map