/**
 * XYWH represents the x, y, width, and height of an element or block.
 */
export type XYWH = [number, number, number, number];

/**
 * SerializedXYWH is a string that represents the x, y, width, and height of a block.
 */
export type SerializedXYWH = `[${number},${number},${number},${number}]`;

export function serializeXYWH(
  x: number,
  y: number,
  w: number,
  h: number
): SerializedXYWH {
  // 检查并修复NaN值
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  const safeW = isNaN(w) ? 100 : w; // 默认宽度
  const safeH = isNaN(h) ? 100 : h; // 默认高度
  
  return `[${safeX},${safeY},${safeW},${safeH}]`;
}

export function deserializeXYWH(xywh: string): XYWH {
  try {
    // 检查是否包含NaN字符串
    if (xywh.includes('NaN')) {
      console.warn('XYWH contains NaN values, using defaults:', xywh);
      return [0, 0, 100, 100];
    }
    
    const parsed = JSON.parse(xywh) as XYWH;
    
    // 验证解析后的值
    const [x, y, w, h] = parsed;
    return [
      isNaN(x) ? 0 : x,
      isNaN(y) ? 0 : y,
      isNaN(w) ? 100 : w,
      isNaN(h) ? 100 : h
    ];
  } catch (e) {
    console.error('Failed to deserialize xywh', xywh);
    console.error(e);

    return [0, 0, 100, 100]; // 增加默认宽高
  }
}
