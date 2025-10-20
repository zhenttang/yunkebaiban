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
export function uint8ArrayToBase64(array: Uint8Array): Promise<string> {
  return new Promise<string>(resolve => {
    const blob = new Blob([array]);
    const reader = new FileReader();
    reader.onload = function () {
      const dataUrl = reader.result as string | null;
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
export function base64ToUint8Array(base64: string): Uint8Array {
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
export function isEmptyUpdate(binary: Uint8Array): boolean {
  return (
    binary.byteLength === 0 ||
    (binary.byteLength === 2 && binary[0] === 0 && binary[1] === 0)
  );
}

/**
 * 验证 Base64 字符串是否为有效的 YJS 更新数据
 * @param base64 Base64 编码的字符串
 * @returns boolean 是否为有效的更新数据
 */
export function isValidYjsUpdate(base64: string): boolean {
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
  } catch (error) {
    return false;
  }
}

/**
 * 日志记录辅助函数
 */
export function logYjsUpdateInfo(label: string, binary: Uint8Array, base64?: string) {
  console.log(`🔍 [YJS-${label}] 数据信息:`);
  console.log(`  📊 二进制长度: ${binary.byteLength} 字节`);
  console.log(`  🔢 前8字节: [${Array.from(binary.slice(0, 8)).join(', ')}]`);
  console.log(`  🌟 是否为空更新: ${isEmptyUpdate(binary)}`);
  
  if (base64) {
    console.log(`  📝 Base64长度: ${base64.length} 字符`);
    console.log(`  ✅ Base64有效性: ${isValidYjsUpdate(base64)}`);
  }
}