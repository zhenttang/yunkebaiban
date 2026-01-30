// 🔧 Android Worker 环境配置
// 使用轻量级 Worker bootstrap，避免加载 @yunke/config（会触发环境变量检查）

if (typeof globalThis !== 'undefined') {
  const originalIsAndroid = (globalThis as any).BUILD_CONFIG?.isAndroid || false;
  
  (globalThis as any).BUILD_CONFIG = {
    ...(globalThis as any).BUILD_CONFIG,
    isAndroid: true,
    isCapacitor: true,
    isWeb: true,
    isMobileWeb: true,
    isMobileEdition: true,
    _originalIsAndroid: originalIsAndroid,
    _isWorker: true
  };
  
  console.log('🔧 Android Worker BUILD_CONFIG:', (globalThis as any).BUILD_CONFIG);
}

// 🔧 使用轻量级 Worker bootstrap（不会触发 @yunke/config）
import '@yunke/core/bootstrap/worker';
