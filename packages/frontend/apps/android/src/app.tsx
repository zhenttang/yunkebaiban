// Android环境配置
// 这必须在任何其他import之前执行
if (typeof window !== 'undefined') {
  // 确保BUILD_CONFIG存在
  if (!(window as any).BUILD_CONFIG) {
    (window as any).BUILD_CONFIG = {};
  }
  
  // 保持Android标识，但使用Web存储
  (window as any).BUILD_CONFIG = {
    ...(window as any).BUILD_CONFIG,
    isAndroid: true,           // 保持Android标识
    isWeb: false,              // 不是纯Web环境
    isMobileWeb: false,        // 不是移动Web
    isMobileEdition: true,     // 是移动版
    isDesktop: false,          // 不是桌面版
    isCapacitor: true,         // 标记为Capacitor环境
    // 添加存储策略标识
    storageStrategy: 'web',    // 使用Web存储策略
    platform: 'android'        // 平台标识
  };
  
  console.log('🔧 Android BUILD_CONFIG配置:', (window as any).BUILD_CONFIG);
  
  // 设置全局错误处理器
  window.addEventListener('error', (event) => {
    console.error('🔴 全局错误:', event.error);
    
    // 特殊处理 "Cannot read properties of undefined (reading 'get')" 错误
    if (event.error?.message?.includes("Cannot read properties of undefined (reading 'get')")) {
      console.error('🎯 [Android错误调试] 检测到目标错误！');
      console.error('错误位置:', event.filename, '行:', event.lineno, '列:', event.colno);
      console.error('错误堆栈:', event.error.stack);
      
      // 特别检查是否是9199.2ac55e48.js中的e_函数
      if (event.error.stack?.includes('9199.2ac55e48.js:1:12613') && 
          event.error.stack?.includes('e_')) {
        console.error('🔥 [Android错误调试] 确认是目标错误 - e_函数中的get访问！');
        
        // 分析堆栈，看起来是在渲染过程中发生的
        if (event.error.stack?.includes('DetailPageWrapper') || 
            event.error.stack?.includes('useLoadDoc')) {
          console.error('🔥 [Android错误调试] 错误与DetailPageWrapper/useLoadDoc相关');
        }
        
        // 检查是否与workspace engine相关
        if (event.error.stack?.includes('workspace') || 
            event.error.stack?.includes('engine')) {
          console.error('🔥 [Android错误调试] 错误可能与workspace或engine相关');
        }
        
        // 🛡️ Android错误恢复机制
        try {
          console.log('🔧 [Android错误恢复] 尝试执行错误恢复...');
          
          // 清理可能的悬挂引用
          if (typeof window !== 'undefined') {
            // 触发垃圾回收（如果可用）
            if ((window as any).gc) {
              (window as any).gc();
              console.log('✅ [Android错误恢复] 执行垃圾回收');
            }
            
            // 清理定时器（需要先声明变量）
            const activeTimers = (window as any).activeTimers;
            const activeIntervals = (window as any).activeIntervals;
            
            if (activeTimers && activeTimers.size > 0) {
              console.log(`🧹 [Android错误恢复] 清理 ${activeTimers.size} 个活动定时器`);
              activeTimers.forEach((id: number) => clearTimeout(id));
              activeTimers.clear();
            }
            
            if (activeIntervals && activeIntervals.size > 0) {
              console.log(`🧹 [Android错误恢复] 清理 ${activeIntervals.size} 个活动间隔器`);
              activeIntervals.forEach((id: number) => clearInterval(id));
              activeIntervals.clear();
            }
          }
          
          console.log('✅ [Android错误恢复] 错误恢复完成');
        } catch (recoveryError) {
          console.error('❌ [Android错误恢复] 恢复过程失败:', recoveryError);
        }
      }
      
      // 打印当前framework状态
      try {
        console.error('🔍 [Android错误调试] 当前状态检查:');
        console.error('  - frameworkProvider存在:', !!frameworkProvider);
        console.error('  - framework存在:', !!framework);
        console.error('  - BUILD_CONFIG:', (window as any).BUILD_CONFIG);
        
        // 检查CloudWorkspaceFlavourProvider状态
        if (frameworkProvider) {
          try {
            const workspaceFlavours = frameworkProvider.get('WorkspaceFlavoursProvider');
            console.error('  - WorkspaceFlavoursProvider存在:', !!workspaceFlavours);
            
            // 尝试获取其他可能相关的服务
            try {
              const workspaceRepo = frameworkProvider.get('WorkspaceRepositoryService');
              console.error('  - WorkspaceRepositoryService存在:', !!workspaceRepo);
            } catch (e) {
              console.error('  - 获取WorkspaceRepositoryService失败:', e.message);
            }
            
            try {
              const engineService = frameworkProvider.get('WorkspaceEngineService');
              console.error('  - WorkspaceEngineService存在:', !!engineService);
            } catch (e) {
              console.error('  - 获取WorkspaceEngineService失败:', e.message);
            }
            
          } catch (e) {
            console.error('  - 获取WorkspaceFlavoursProvider失败:', e.message);
          }
        }
      } catch (e) {
        console.error('🔍 [Android错误调试] 状态检查失败:', e);
      }
      
      // 阻止错误传播，避免应用崩溃
      event.preventDefault();
      return false;
    }
    
    if (event.error?.stack) {
      console.error('错误堆栈:', event.error.stack);
    }
    // 阻止默认错误处理
    event.preventDefault();
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🔴 未处理的Promise拒绝:', event.reason);
    event.preventDefault();
  });
}

import { getStoreManager } from '@affine/core/blocksuite/manager/store';
import { AffineContext } from '@affine/core/components/context';
import { AppFallback } from '@affine/core/mobile/components/app-fallback';
import { configureMobileModules } from '@affine/core/mobile/modules';
import { VirtualKeyboardProvider } from '@affine/core/mobile/modules/virtual-keyboard';
import { router } from '@affine/core/mobile/router';
import { configureCommonModules } from '@affine/core/modules';
import { AIButtonProvider } from '@affine/core/modules/ai-button';
import {
  AuthProvider,
  AuthService,
  DefaultServerService,
  ServerScope,
  ServerService,
  ServersService,
  ValidatorProvider,
} from '@affine/core/modules/cloud';
import { FeatureFlagService } from '@affine/core/modules/feature-flag';

// 不需要再次定义BUILD_CONFIG，已经在文件开头处理了
import { DocsService } from '@affine/core/modules/doc';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { I18nProvider } from '@affine/core/modules/i18n';
import { LifecycleService } from '@affine/core/modules/lifecycle';
import {
  configureLocalStorageStateStorageImpls,
  NbstoreProvider,
} from '@affine/core/modules/storage';
import { PopupWindowProvider } from '@affine/core/modules/url';
import { ClientSchemeProvider } from '@affine/core/modules/url/providers/client-schema';
import { configureBrowserWorkbenchModule } from '@affine/core/modules/workbench';
import { WorkspacesService } from '@affine/core/modules/workspace';
import { configureBrowserWorkspaceFlavours } from '@affine/core/modules/workspace-engine'; // 恢复使用原始配置
import { getWorkerUrl } from '@affine/env/worker';
import { I18n } from '@affine/i18n';
import { StoreManagerClient } from '@affine/nbstore/worker/client';
import { Container } from '@blocksuite/affine/global/di';
import {
  docLinkBaseURLMiddleware,
  MarkdownAdapter,
  titleMiddleware,
} from '@blocksuite/affine/shared/adapters';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { InAppBrowser } from '@capgo/inappbrowser';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { AsyncCall } from 'async-call-rpc';
import { useTheme } from 'next-themes';
import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { AffineTheme } from './plugins/affine-theme';
import { AIButton } from './plugins/ai-button';
import { Auth } from './plugins/auth';
import { HashCash } from './plugins/hashcash';
// import { NbStoreNativeDBApis } from './plugins/nbstore'; // 移除原生DB API
import { writeEndpointToken } from './proxy';
import { configureAndroidAuthProvider } from './auth-provider';

// 先定义createStoreManagerClient函数
function createStoreManagerClient() {
  try {
    const workerUrl = getWorkerUrl('nbstore');
    console.log('🔧 创建Worker，URL:', workerUrl);
    
    const worker = new Worker(workerUrl);
    
    console.log('🔧 Android主线程创建StoreManager:', {
      workerUrl: workerUrl,
      buildConfig: (window as any).BUILD_CONFIG,
      storageStrategy: 'Web存储方案 (IndexedDB + Cloud)'
    });
    
    const opClient = new OpClient(worker);
    const storeManagerClient = new StoreManagerClient(opClient);
    
    return storeManagerClient;
  } catch (error) {
    console.error('❌ 创建StoreManagerClient失败:', error);
    // 提供fallback机制
    console.error('尝试使用fallback存储方案...');
    throw error;
  }
}

// 延迟创建storeManagerClient，避免初始化顺序问题
let storeManagerClient: StoreManagerClient | null = null;

try {
  storeManagerClient = createStoreManagerClient();
  window.addEventListener('beforeunload', () => {
    storeManagerClient?.dispose();
  });
} catch (error) {
  console.error('❌ 初始化StoreManagerClient失败，将在稍后重试:', error);
}

const future = {
  v7_startTransition: true,
} as const;

const framework = new Framework();

// 配置所有模块
try {
  console.log('🚀 开始配置框架模块...');
  
  configureCommonModules(framework);
  console.log('✅ CommonModules 配置成功');
  
  configureBrowserWorkbenchModule(framework);
  console.log('✅ BrowserWorkbenchModule 配置成功');
  
  configureLocalStorageStateStorageImpls(framework);
  console.log('✅ LocalStorageStateStorage 配置成功');
  
  configureBrowserWorkspaceFlavours(framework);
  console.log('✅ BrowserWorkspaceFlavours 配置成功');
  
  configureMobileModules(framework);
  console.log('✅ MobileModules 配置成功');
  
} catch (error) {
  console.error('❌ 框架模块配置失败:', error);
  // 继续执行，某些功能可能受限
}
// 实现NbstoreProvider，添加错误处理
framework.impl(NbstoreProvider, {
  openStore(key, options) {
    if (!storeManagerClient) {
      console.warn('⚠️ StoreManagerClient未初始化，尝试创建...');
      try {
        storeManagerClient = createStoreManagerClient();
      } catch (error) {
        console.error('❌ 无法创建StoreManagerClient:', error);
        throw new Error('存储系统初始化失败');
      }
    }
    
    try {
      const { store, dispose } = storeManagerClient.open(key, options);
      return {
        store,
        dispose: () => {
          dispose();
        },
      };
    } catch (error) {
      console.error('❌ 打开存储失败:', error);
      throw error;
    }
  },
});
// 延迟创建frameworkProvider，等待framework配置完成
let frameworkProvider: Framework | null = null;

try {
  frameworkProvider = framework.provider();
  console.log('✅ Framework provider 创建成功');
  
  // 为Android环境添加服务获取包装器 - 强化版本
  if ((window as any).BUILD_CONFIG?.isAndroid) {
    const originalGet = frameworkProvider.get.bind(frameworkProvider);
    let serviceCache = new Map();
    
    frameworkProvider.get = function(serviceIdentifier: any) {
      const serviceName = serviceIdentifier?.name || serviceIdentifier?.toString() || 'unknown';
      console.log(`🔧 [Android服务获取] 请求服务: ${serviceName}`);
      
      // 先检查缓存
      if (serviceCache.has(serviceIdentifier)) {
        console.log(`📋 [Android服务获取] 从缓存返回: ${serviceName}`);
        return serviceCache.get(serviceIdentifier);
      }
      
      try {
        // 🛡️ 增加防御性检查，确保originalGet函数存在且可调用
        if (typeof originalGet !== 'function') {
          throw new Error('originalGet不是一个有效的函数');
        }
        
        // 🛡️ 检查serviceIdentifier是否有效
        if (!serviceIdentifier) {
          throw new Error('serviceIdentifier为空或未定义');
        }
        
        console.log(`🔍 [Android服务获取] 尝试获取服务: ${serviceName}`);
        const service = originalGet(serviceIdentifier);
        
        if (service) {
          console.log(`✅ [Android服务获取] 成功获取服务: ${serviceName}`);
          serviceCache.set(serviceIdentifier, service);
        } else {
          console.warn(`⚠️ [Android服务获取] 服务返回为空: ${serviceName}`);
        }
        
        return service;
      } catch (error) {
        console.error(`❌ [Android服务获取] 服务获取失败 [${serviceName}]:`, error);
        console.error('错误详情:', {
          errorMessage: error.message,
          errorStack: error.stack,
          serviceIdentifier: serviceIdentifier,
          serviceName: serviceName
        });
        
        // 对于某些关键服务，提供默认实现
        if (serviceName.includes('FeatureFlag')) {
          const mockFeatureFlagService = {
            getFlag: (flag: string) => {
              console.log(`📋 使用默认FeatureFlag值: ${flag} = false`);
              return false;
            },
            flags$: { value: {} }
          };
          serviceCache.set(serviceIdentifier, mockFeatureFlagService);
          return mockFeatureFlagService;
        }
        
        // 检查是否是特定的"Cannot read properties of undefined (reading 'get')"错误
        if (error.message?.includes("Cannot read properties of undefined (reading 'get')")) {
          console.error('🔥 [Android错误调试] 确认在服务获取中发现目标错误!');
          console.error('  - serviceIdentifier:', serviceIdentifier);
          console.error('  - serviceName:', serviceName);
          console.error('  - originalGet类型:', typeof originalGet);
          console.error('  - frameworkProvider类型:', typeof frameworkProvider);
          
          // 特殊处理：尝试绕过错误
          return null;
        }
        
        // 重新抛出错误
        throw error;
      }
    };
    
    console.log('✅ 添加了增强版Android服务获取包装器');
  }
} catch (error) {
  console.error('❌ Framework provider 创建失败:', error);
  // 提供一个基础的provider
  frameworkProvider = framework;
}

framework.impl(PopupWindowProvider, {
  open: (url: string) => {
    InAppBrowser.open({
      url: url,
    }).catch(console.error);
  },
});

framework.impl(ClientSchemeProvider, {
  getClientScheme() {
    return 'affine';
  },
});

framework.impl(VirtualKeyboardProvider, {
  show: () => {
    Keyboard.show().catch(console.error);
  },
  hide: () => {
    // In some cases, the keyboard will show again. for example, it will show again
    // when this function is called in click event of button. It may be a bug of
    // android webview or capacitor.
    setTimeout(() => {
      Keyboard.hide().catch(console.error);
    });
  },
  onChange: callback => {
    let disposeRef = {
      dispose: () => {},
    };

    Promise.all([
      Keyboard.addListener('keyboardWillShow', info => {
        (async () => {
          // 添加平台检查，只在原生平台执行
          if (Capacitor.isNativePlatform()) {
            try {
              const navBarHeight = (await AffineTheme.getSystemNavBarHeight())
                .height;
              callback({
                visible: true,
                height: info.keyboardHeight - navBarHeight,
              });
            } catch (error) {
              console.warn('AffineTheme.getSystemNavBarHeight failed:', error);
              callback({
                visible: true,
                height: info.keyboardHeight,
              });
            }
          } else {
            callback({
              visible: true,
              height: info.keyboardHeight,
            });
          }
        })().catch(console.error);
      }),
      Keyboard.addListener('keyboardWillHide', () => {
        callback({
          visible: false,
          height: 0,
        });
      }),
    ])
      .then(handlers => {
        disposeRef.dispose = () => {
          Promise.all(handlers.map(handler => handler.remove())).catch(
            console.error
          );
        };
      })
      .catch(console.error);

    return () => {
      disposeRef.dispose();
    };
  },
});

framework.impl(ValidatorProvider, {
  async validate(_challenge, resource) {
    const res = await HashCash.hash({ challenge: resource });
    return res.value;
  },
});

framework.impl(AIButtonProvider, {
  presentAIButton: () => {
    return AIButton.present();
  },
  dismissAIButton: () => {
    return AIButton.dismiss();
  },
});

// Android环境下的编辑器配置补丁
// 某些编辑器服务可能需要特殊处理
if (typeof window !== 'undefined') {
  // 为编辑器添加必要的polyfill
  if (!window.ResizeObserver) {
    console.warn('⚠️ ResizeObserver不存在，添加polyfill');
    // 添加一个简单的ResizeObserver polyfill
    (window as any).ResizeObserver = class ResizeObserver {
      constructor(callback: any) {
        console.log('使用ResizeObserver polyfill');
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  
  // 检查其他可能缺失的API
  if (!window.IntersectionObserver) {
    console.warn('⚠️ IntersectionObserver不存在，添加polyfill');
    (window as any).IntersectionObserver = class IntersectionObserver {
      constructor(callback: any) {
        console.log('使用IntersectionObserver polyfill');
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

// 配置Android专用AuthProvider
try {
  configureAndroidAuthProvider(framework);
  console.log('✅ Android AuthProvider 配置成功');
} catch (error) {
  console.error('❌ Android AuthProvider 配置失败:', error);
}

// 添加调试日志
console.log('=== 🤖 Android应用初始化 ===');
console.log('📊 环境配置验证:');
console.log('  - BUILD_CONFIG.isAndroid:', (window as any).BUILD_CONFIG?.isAndroid);
console.log('  - BUILD_CONFIG.isWeb:', (window as any).BUILD_CONFIG?.isWeb);
console.log('  - BUILD_CONFIG.isMobileWeb:', (window as any).BUILD_CONFIG?.isMobileWeb);
console.log('  - BUILD_CONFIG.isMobileEdition:', (window as any).BUILD_CONFIG?.isMobileEdition);
console.log('🎯 存储策略: Web存储方案 (IndexedDB + Cloud)');

// 添加全局调试工具
(window as any).__debugGetService = (serviceName: string) => {
  if (!frameworkProvider) {
    console.error('❌ frameworkProvider未初始化');
    return null;
  }
  
  try {
    const service = frameworkProvider.get(serviceName);
    console.log(`✅ 成功获取服务 [${serviceName}]:`, service);
    return service;
  } catch (error) {
    console.error(`❌ 获取服务失败 [${serviceName}]:`, error);
    return null;
  }
};

// 添加服务诊断工具
(window as any).__diagnoseServices = () => {
  console.log('=== 🔍 服务诊断开始 ===');
  
  const services = [
    'GlobalContextService',
    'WorkspacesService', 
    'ServersService',
    'DefaultServerService',
    'AuthService',
    'LifecycleService',
    'FeatureFlagService'
  ];
  
  services.forEach(serviceName => {
    try {
      if (frameworkProvider) {
        const service = frameworkProvider.get(serviceName);
        console.log(`✅ ${serviceName}: 正常`);
      }
    } catch (error) {
      console.error(`❌ ${serviceName}: 失败 - ${error.message}`);
    }
  });
  
  console.log('=== 🔍 服务诊断结束 ===');
};

console.log('💡 调试提示: 使用 __debugGetService("服务名") 获取服务');
console.log('💡 调试提示: 使用 __diagnoseServices() 诊断所有服务');

// Android WebView 生命周期管理
if (typeof window !== 'undefined' && (window as any).BUILD_CONFIG?.isAndroid) {
  console.log('🔧 启用Android WebView生命周期管理');
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('📱 Android应用进入后台，执行清理');
      // 触发垃圾回收提示
      if ((window as any).gc) {
        try {
          (window as any).gc();
        } catch (e) {
          console.log('GC调用失败:', e);
        }
      }
    } else {
      console.log('📱 Android应用恢复前台');
    }
  });
  
  // 拦截并包装所有的 setTimeout 和 setInterval
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  const originalClearTimeout = window.clearTimeout;
  const originalClearInterval = window.clearInterval;
  
  const activeTimers = new Set<number>();
  const activeIntervals = new Set<number>();
  
  window.setTimeout = function(callback: any, delay?: number, ...args: any[]) {
    const wrappedCallback = function() {
      try {
        activeTimers.delete(timerId);
        if (typeof callback === 'function') {
          callback.apply(null, args);
        }
      } catch (error) {
        console.error('❌ setTimeout回调执行错误:', error);
      }
    };
    
    const timerId = originalSetTimeout.call(window, wrappedCallback, delay);
    activeTimers.add(timerId);
    return timerId;
  };
  
  window.clearTimeout = function(timerId?: number) {
    if (timerId) {
      activeTimers.delete(timerId);
    }
    return originalClearTimeout.call(window, timerId);
  };
  
  window.setInterval = function(callback: any, delay?: number, ...args: any[]) {
    const wrappedCallback = function() {
      try {
        if (typeof callback === 'function') {
          callback.apply(null, args);
        }
      } catch (error) {
        console.error('❌ setInterval回调执行错误:', error);
        // 如果出错，清理这个interval
        window.clearInterval(intervalId);
      }
    };
    
    const intervalId = originalSetInterval.call(window, wrappedCallback, delay);
    activeIntervals.add(intervalId);
    return intervalId;
  };
  
  window.clearInterval = function(intervalId?: number) {
    if (intervalId) {
      activeIntervals.delete(intervalId);
    }
    return originalClearInterval.call(window, intervalId);
  };
  
  // 页面卸载时清理所有定时器
  window.addEventListener('beforeunload', () => {
    console.log('🧹 清理所有活动定时器');
    activeTimers.forEach(id => clearTimeout(id));
    activeIntervals.forEach(id => clearInterval(id));
  });
}

// Android专用：监听原生JWT认证初始化事件
window.addEventListener('affine-auth-initialized', (event: any) => {
  console.log('🔥 收到原生JWT认证初始化事件:', event.detail);
  const { token, server } = event.detail;
  
  // 验证Token是否已正确注入
  const storedToken = localStorage.getItem('affine-admin-token');
  console.log('🔍 验证localStorage中的Token:', storedToken?.substring(0, 30) + '...');
  
  if (storedToken && storedToken === token) {
    console.log('✅ JWT Token同步成功，触发认证状态更新');
    
    // 手动触发认证服务重新验证
    setTimeout(() => {
      try {
        const authService = frameworkProvider.get(AuthService);
        console.log('🔄 手动触发认证状态刷新');
        authService.session.revalidate();
      } catch (e) {
        console.warn('⚠️ 手动刷新认证状态失败:', e);
      }
    }, 500);
  } else {
    console.error('❌ JWT Token同步失败!');
  }
});

// Android专用：全局替换localhost为实际服务器地址
const ANDROID_SERVER_HOST = '192.168.31.28:8080';

// 最关键：拦截所有网络请求，查看是否到达服务器
const originalFetch = window.fetch;
window.fetch = function(...args) {
  let [input, init] = args;
  
  // 使用Request构造函数来规范化所有类型的input（字符串、URL对象、Request对象）
  const request = new Request(input, init);
  let url = request.url;
  
  // Android专用：将localhost替换为实际服务器地址
  url = url.replace(/localhost:8080/g, ANDROID_SERVER_HOST);
  url = url.replace(/localhost\/api/g, `${ANDROID_SERVER_HOST}/api`);
  
  // 🔧 创建新的Request对象，并强制使用HTTP/1.1
  const originalHeaders = {};
  if (request.headers) {
    // 正确复制headers
    request.headers.forEach((value, key) => {
      originalHeaders[key] = value;
    });
  }
  
  const modifiedInit = {
    ...init,
    headers: {
      ...originalHeaders,
      // 强制使用HTTP/1.1协议
      'Connection': 'close',
      'Cache-Control': 'no-cache',
    }
  };
  
  const modifiedRequest = new Request(url, modifiedInit);
  
  // 🔧 只对重要请求输出日志，减少刷屏
  const isImportantRequest = url.includes('/api/auth') || 
                            url.includes('/api/workspaces') ||
                            url.includes('/api/user') ||
                            modifiedRequest.method !== 'GET';
  
  if (isImportantRequest) {
    console.log('🌐 重要请求:', modifiedRequest.method, url);
    console.log('🎯 请求Headers:');
    modifiedRequest.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // 检查请求体
    if (modifiedRequest.body) {
      console.log('📦 请求Body存在');
    }
    
    // 检查Authorization头
    const authHeader = modifiedRequest.headers.get('Authorization');
    if (authHeader) {
      console.log('✅ JWT Token存在');
    } else {
      console.warn('⚠️ 没有JWT Token');
    }
  }
  
  // 使用修改后的Request对象调用原始fetch
  return originalFetch.call(this, modifiedRequest)
    .then(response => {
      if (isImportantRequest || !response.ok) {
        console.log('📡 响应:', response.status, response.url);
        
        if (!response.ok) {
          console.error('❌ 请求失败 - 状态码:', response.status);
          if (response.status === 404) {
            console.error('❌ 404错误 - 接口不存在');
          } else if (response.status === 401) {
            console.error('❌ 401错误 - 认证失败');
          }
        }
      }
      
      return response;
    })
    .catch(error => {
      console.error('🔴 网络异常:', error.message, 'URL:', url);
      
      // 如果是ERR_H2_OR_QUIC_REQUIRED错误，提供更明确的提示
      if (error.message && error.message.includes('ERR_H2_OR_QUIC_REQUIRED')) {
        console.error('❌ 服务器强制要求HTTP/2，但Android不支持。请检查服务器配置！');
      }
      
      throw error;
    });
};

// 检查Capacitor配置
console.log('=== ⚙️  Capacitor配置检查 ===');
try {
  const capacitorConfig = (window as any)?.Capacitor?.getConfig?.() || {};
  console.log('Capacitor配置:', capacitorConfig);
  console.log('服务器URL配置:', capacitorConfig.server?.url);
  console.log('是否允许明文:', capacitorConfig.server?.cleartext);
  console.log('是否允许混合内容:', capacitorConfig.server?.allowMixedContent);
} catch (error) {
  console.error('无法获取Capacitor配置:', error);
}

// 添加服务器配置调试 - 重点检查baseUrl
setTimeout(() => {
  try {
    const globalContextService = frameworkProvider.get(GlobalContextService);
    const serversService = frameworkProvider.get(ServersService);  
    const defaultServerService = frameworkProvider.get(DefaultServerService);
    
    console.log('=== 🌐 关键：服务器配置检查 ===');
    const currentServer = defaultServerService.server;
    console.log('🎯 当前服务器baseUrl:', currentServer?.baseUrl);
    console.log('🎯 当前服务器serverMetadata.baseUrl:', currentServer?.serverMetadata?.baseUrl);
    
    // 关键检查：确认实际使用的baseUrl
    const actualBaseUrl = currentServer?.serverMetadata?.baseUrl || currentServer?.baseUrl;
    console.log('🎯 实际使用的BaseURL:', actualBaseUrl);
    
    if (actualBaseUrl && !actualBaseUrl.includes('192.168.31.28:8080')) {
      console.error('❌ BaseURL配置错误! 期望包含192.168.31.28:8080，实际:', actualBaseUrl);
    } else {
      console.log('✅ BaseURL配置正确');
    }
    
    // 检查工作区服务
    console.log('=== 🔍 工作区服务检查 ===');
    try {
      const workspacesService = frameworkProvider.get(WorkspacesService);
      console.log('✅ WorkspacesService 已注册');
      
      // 检查工作区列表
      setTimeout(() => {
        const workspaceList = workspacesService.list;
        console.log('📦 工作区列表状态:', {
          isRevalidating: workspaceList.isRevalidating$.value,
          workspacesCount: workspaceList.workspaces$.value.length
        });
        
        // 尝试刷新工作区列表
        console.log('🔄 尝试刷新工作区列表...');
        workspaceList.revalidate();
      }, 1000);
      
    } catch (e) {
      console.error('❌ 无法获取WorkspacesService:', e);
    }
    
    // 检查认证token
    console.log('=== 🔐 关键：Token检查 ===');
    const adminToken = localStorage.getItem('affine-admin-token');
    const accessToken = localStorage.getItem('affine-access-token');
    
    if (adminToken) {
      console.log('✅ Admin Token存在:', adminToken.substring(0, 20) + '...');
    } else if (accessToken) {
      console.log('✅ Access Token存在:', accessToken.substring(0, 20) + '...');  
    } else {
      console.error('❌ 没有找到任何Token!');
    }
    
    // 直接测试API连接
    console.log('=== 🧪 直接API测试 ===');
    const testUrl = `${actualBaseUrl}/api/workspaces`;
    console.log('测试URL:', testUrl);
    
    const token = adminToken || accessToken;
    if (!token) {
      console.error('❌ 无法测试API - 没有Token');
      return;
    }
    
    fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('🧪 API测试响应状态:', response.status);
      if (response.status === 200) {
        console.log('✅ API连接成功!');
      } else if (response.status === 404) {
        console.error('❌ API 404 - 检查后端是否有/api/workspaces接口');
      } else if (response.status === 401) {
        console.error('❌ API 401 - Token认证失败');
      }
      return response.text();
    })
    .then(text => {
      console.log('🧪 API响应内容:', text.substring(0, 200) + '...');
    })
    .catch(error => {
      console.error('🧪 API测试失败:', error.message);
    });
    
  } catch (error) {
    console.error('服务器配置检查失败:', error);
  }
}, 2000);

// ------ some apis for native ------
// 确保在frameworkProvider创建后再挂载全局函数
setTimeout(() => {
  console.log('🔧 开始挂载全局API函数...');
  
  (window as any).getCurrentServerBaseUrl = () => {
    try {
      if (!frameworkProvider) {
        console.error('❌ frameworkProvider未初始化');
        return 'http://192.168.31.28:8080'; // 返回默认值
      }
      const globalContextService = frameworkProvider.get(GlobalContextService);
      const currentServerId = globalContextService.globalContext.serverId.get();
      const serversService = frameworkProvider.get(ServersService);
      const defaultServerService = frameworkProvider.get(DefaultServerService);
      const currentServer =
        (currentServerId ? serversService.server$(currentServerId).value : null) ??
        defaultServerService.server;
      return currentServer.baseUrl;
    } catch (error) {
      console.error('❌ getCurrentServerBaseUrl错误:', error);
      return 'http://192.168.31.28:8080'; // 返回默认值
    }
  };
  
  (window as any).getCurrentI18nLocale = () => {
    return I18n.language;
  };
  
  (window as any).getCurrentWorkspaceId = () => {
    try {
      if (!frameworkProvider) {
        console.error('❌ frameworkProvider未初始化');
        return null;
      }
      const globalContextService = frameworkProvider.get(GlobalContextService);
      return globalContextService.globalContext.workspaceId.get();
    } catch (error) {
      console.error('❌ getCurrentWorkspaceId错误:', error);
      return null;
    }
  };
  
  (window as any).getCurrentDocId = () => {
    try {
      if (!frameworkProvider) {
        console.error('❌ frameworkProvider未初始化');
        return null;
      }
      const globalContextService = frameworkProvider.get(GlobalContextService);
      return globalContextService.globalContext.docId.get();
    } catch (error) {
      console.error('❌ getCurrentDocId错误:', error);
      return null;
    }
  };
  
  (window as any).getCurrentDocContentInMarkdown = async () => {
    try {
      if (!frameworkProvider) {
        console.error('❌ frameworkProvider未初始化');
        return null;
      }
      const globalContextService = frameworkProvider.get(GlobalContextService);
      const currentWorkspaceId =
        globalContextService.globalContext.workspaceId.get();
      const currentDocId = globalContextService.globalContext.docId.get();
      const workspacesService = frameworkProvider.get(WorkspacesService);
      const workspaceRef = currentWorkspaceId
        ? workspacesService.openByWorkspaceId(currentWorkspaceId)
        : null;
      if (!workspaceRef) {
        return;
      }
      const { workspace, dispose: disposeWorkspace } = workspaceRef;

      const docsService = workspace.scope.get(DocsService);
      const docRef = currentDocId ? docsService.open(currentDocId) : null;
      if (!docRef) {
        return;
      }
      const { doc, release: disposeDoc } = docRef;

      try {
        const blockSuiteDoc = doc.blockSuiteDoc;

        const transformer = blockSuiteDoc.getTransformer([
          docLinkBaseURLMiddleware(blockSuiteDoc.workspace.id),
          titleMiddleware(blockSuiteDoc.workspace.meta.docMetas),
        ]);
        const snapshot = transformer.docToSnapshot(blockSuiteDoc);

        const container = new Container();
        getStoreManager()
          .config.init()
          .value.get('store')
          .forEach(ext => {
            ext.setup(container);
          });
        const provider = container.provider();

        const adapter = new MarkdownAdapter(transformer, provider);
        if (!snapshot) {
          return;
        }

        const markdownResult = await adapter.fromDocSnapshot({
          snapshot,
          assets: transformer.assetsManager,
        });
        return markdownResult.file;
      } finally {
        disposeDoc();
        disposeWorkspace();
      }
    } catch (error) {
      console.error('❌ getCurrentDocContentInMarkdown错误:', error);
      return null;
    }
  };
  
  console.log('✅ 全局API函数挂载完成');
  
  // 测试函数是否正常
  console.log('🧪 测试全局函数:');
  console.log('  - getCurrentServerBaseUrl:', typeof (window as any).getCurrentServerBaseUrl);
  console.log('  - getCurrentI18nLocale:', typeof (window as any).getCurrentI18nLocale);
  console.log('  - getCurrentWorkspaceId:', typeof (window as any).getCurrentWorkspaceId);
  console.log('  - getCurrentDocId:', typeof (window as any).getCurrentDocId);
  console.log('  - getCurrentDocContentInMarkdown:', typeof (window as any).getCurrentDocContentInMarkdown);
}, 100); // 延迟100ms确保framework初始化完成

// setup application lifecycle events, and emit application start event
window.addEventListener('focus', () => {
  if (frameworkProvider) {
    try {
      frameworkProvider.get(LifecycleService).applicationFocus();
    } catch (error) {
      console.error('❌ applicationFocus错误:', error);
    }
  }
});

// 延迟启动应用生命周期
setTimeout(() => {
  if (frameworkProvider) {
    try {
      frameworkProvider.get(LifecycleService).applicationStart();
      console.log('✅ 应用生命周期启动成功');
    } catch (error) {
      console.error('❌ applicationStart错误:', error);
    }
  }
}, 200);

CapacitorApp.addListener('appUrlOpen', ({ url }) => {
  // try to close browser if it's open
  InAppBrowser.close().catch(e => console.error('关闭浏览器失败', e));

  const urlObj = new URL(url);

  if (urlObj.hostname === 'authentication') {
    const method = urlObj.searchParams.get('method');
    const payload = JSON.parse(urlObj.searchParams.get('payload') ?? 'false');

    if (
      !method ||
      (method !== 'magic-link' && method !== 'oauth') ||
      !payload
    ) {
      console.error('无效的认证URL', url);
      return;
    }

    const authService = frameworkProvider
      ?.get(DefaultServerService)
      ?.server?.scope?.get(AuthService);
    if (!authService) {
      console.error('❌ 无法获取AuthService');
      return;
    }
    if (method === 'oauth') {
      authService
        .signInOauth(payload.code, payload.state, payload.provider)
        .catch(console.error);
    } else if (method === 'magic-link') {
      authService
        .signInMagicLink(payload.email, payload.token)
        .catch(console.error);
    }
  }
}).catch(e => {
  console.error(e);
});

const ThemeProvider = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // 添加平台检查，只在原生平台执行StatusBar和AffineTheme操作
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({
        style:
          resolvedTheme === 'dark'
            ? Style.Dark
            : resolvedTheme === 'light'
              ? Style.Light
              : Style.Default,
      }).catch(console.error);
      
      AffineTheme.onThemeChanged({
        darkMode: resolvedTheme === 'dark',
      }).catch(console.error);
    } else {
      console.log('Web环境：跳过原生插件调用 (StatusBar, AffineTheme)');
    }
  }, [resolvedTheme]);
  return null;
};

export function App() {
  // 确保frameworkProvider存在
  if (!frameworkProvider) {
    console.error('❌ frameworkProvider未初始化，显示错误页面');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>应用初始化中...</h2>
        <p>请稍后再试</p>
      </div>
    );
  }
  
  return (
    <Suspense>
      <FrameworkRoot framework={frameworkProvider}>
        <I18nProvider>
          <AffineContext store={getCurrentStore()}>
            <ThemeProvider />
            <RouterProvider
              fallbackElement={<AppFallback />}
              router={router}
              future={future}
            />
          </AffineContext>
        </I18nProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
