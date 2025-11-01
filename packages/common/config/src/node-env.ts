/**
 * Node.js环境下的环境变量读取辅助函数
 * 用于Electron主进程等Node.js环境
 * 注意：这些函数只能读取process.env，不适用于浏览器环境
 */

/**
 * 从process.env获取环境变量（必需项）
 */
export function getRequiredNodeEnvValue(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`❌ 环境变量配置缺失：请在 .env 文件中配置 ${key}`);
  }
  return value.trim();
}

/**
 * 从process.env获取环境变量（可选项，返回空字符串）
 */
export function getNodeEnvValueOrEmpty(key: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : '';
}

/**
 * 获取API基础URL（Node.js环境）
 */
export function getNodeApiBaseUrl(): string {
  return getRequiredNodeEnvValue('VITE_API_BASE_URL');
}

/**
 * 获取Socket.IO URL（Node.js环境）
 */
export function getNodeSocketIOUrl(): string {
  const socketUrl = getNodeEnvValueOrEmpty('VITE_SOCKETIO_URL');
  if (socketUrl) return socketUrl;
  return getNodeApiBaseUrl();
}

/**
 * 获取Electron开发服务器URL（Node.js环境）
 */
export function getNodeElectronDevServerUrl(): string {
  return getRequiredNodeEnvValue('VITE_DEV_SERVER_URL');
}

