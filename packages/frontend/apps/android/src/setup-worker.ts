// Worker环境统一配置：与主线程保持一致，使用Web存储方案
if (typeof globalThis !== 'undefined') {
  const originalIsAndroid = (globalThis as any).BUILD_CONFIG?.isAndroid || false;
  
  // 🔧 关键修复：与主线程保持完全一致的配置
  (globalThis as any).BUILD_CONFIG = {
    ...(globalThis as any).BUILD_CONFIG,
    isAndroid: false,       // 与主线程保持一致：使用IndexedDB存储
    isWeb: true,           // 与主线程保持一致：Web存储后端
    isMobileWeb: true,     // 与主线程保持一致：移动Web环境
    isMobileEdition: true, // 保持移动版特性
    _originalIsAndroid: originalIsAndroid // 保存原始值
  };
  
  console.log('🔧 Android Worker BUILD_CONFIG统一配置:', (globalThis as any).BUILD_CONFIG);
}

import '@yunke/core/bootstrap/browser';
import './proxy';
