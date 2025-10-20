/**
 * YJS 数据编码/解码工具函数
 * 严格按照 YUNKE 原版实现，确保完全兼容
 */
/**
 * 将 Uint8Array 编码为 Base64 字符串
 * 严格按照 YUNKE 原版实现，确保 100% 兼容
 * @param array YJS 更新数据的二进制格式
 * @returns Promise<string> Base64 编码的字符串
 */
export declare function uint8ArrayToBase64(array: Uint8Array): Promise<string>;
/**
 * 将 Base64 字符串解码为 Uint8Array
 * 严格按照 YUNKE 原版实现，确保 100% 兼容
 * @param base64 Base64 编码的字符串
 * @returns Uint8Array YJS 更新数据的二进制格式
 */
export declare function base64ToUint8Array(base64: string): Uint8Array;
/**
 * 检测是否为空的 YJS 更新
 * @param binary YJS 更新数据的二进制格式
 * @returns boolean 是否为空更新
 */
export declare function isEmptyUpdate(binary: Uint8Array): boolean;
/**
 * 验证 Base64 字符串是否为有效的 YJS 更新数据
 * @param base64 Base64 编码的字符串
 * @returns boolean 是否为有效的更新数据
 */
export declare function isValidYjsUpdate(base64: string): boolean;
/**
 * 日志记录辅助函数
 */
export declare function logYjsUpdateInfo(label: string, binary: Uint8Array, base64?: string): void;
//# sourceMappingURL=yjs-utils.d.ts.map