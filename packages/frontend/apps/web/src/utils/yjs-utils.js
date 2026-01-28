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
export function uint8ArrayToBase64(array) {
    return new Promise(resolve => {
        const blob = new Blob([array]);
        const reader = new FileReader();
        reader.onload = function () {
            const dataUrl = reader.result;
            if (!dataUrl) {
                resolve('');
                return;
            }
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.readAsDataURL(blob);
    });
}
/**
 * 将 Base64 字符串解码为 Uint8Array
 * 严格按照 YUNKE 原版实现，确保 100% 兼容
 * @param base64 Base64 编码的字符串
 * @returns Uint8Array YJS 更新数据的二进制格式
 */
export function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const binaryArray = [...binaryString].map(function (char) {
        return char.charCodeAt(0);
    });
    return new Uint8Array(binaryArray);
}
/**
 * 检测是否为空的 YJS 更新
 * @param binary YJS 更新数据的二进制格式
 * @returns boolean 是否为空更新
 */
export function isEmptyUpdate(binary) {
    return (binary.byteLength === 0 ||
        (binary.byteLength === 2 && binary[0] === 0 && binary[1] === 0));
}
/**
 * 验证 Base64 字符串是否为有效的 YJS 更新数据
 * @param base64 Base64 编码的字符串
 * @returns boolean 是否为有效的更新数据
 */
export function isValidYjsUpdate(base64) {
    try {
        if (!base64 || typeof base64 !== 'string') {
            return false;
        }
        // 尝试解码
        const binary = base64ToUint8Array(base64);
        // 检查是否为空更新
        if (isEmptyUpdate(binary)) {
            return true; // 空更新也是有效的
        }
        // 基本的 YJS 更新格式验证
        // YJS 更新通常以特定的字节模式开始
        return binary.length >= 2;
    }
    catch (error) {
        return false;
    }
}
/**
 * 日志记录辅助函数
 */
export function logYjsUpdateInfo(label, binary, base64) {
    void label;
    void binary;
    void base64;
}
//# sourceMappingURL=yjs-utils.js.map
