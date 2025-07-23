// 在Worker环境中修改BUILD_CONFIG，确保Android使用Web存储方案
if (typeof globalThis !== 'undefined') {
  const originalIsAndroid = (globalThis as any).BUILD_CONFIG?.isAndroid || false;
  
  (globalThis as any).BUILD_CONFIG = {
    ...(globalThis as any).BUILD_CONFIG,
    isAndroid: false,  // 关键：设为false以使用IndexedDB
    isWeb: true,       // 设为true确保使用Web存储
    isMobileWeb: true, // 标记为移动Web
    _originalIsAndroid: originalIsAndroid // 保存原始值
  };
  
  console.log('🔧 Android BUILD_CONFIG在setup-worker.ts中已修改:', (globalThis as any).BUILD_CONFIG);
}

import '@affine/core/bootstrap/browser';
import './proxy';
