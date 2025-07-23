// 在最开始就修改BUILD_CONFIG，确保Android使用Web配置
// 这必须在任何其他import之前执行
if (typeof window !== 'undefined') {
  // 保存原始的isAndroid值用于其他用途
  const originalIsAndroid = (window as any).BUILD_CONFIG?.isAndroid || false;
  
  // 修改BUILD_CONFIG，让系统认为是Web环境，从而使用IndexedDB
  (window as any).BUILD_CONFIG = {
    ...(window as any).BUILD_CONFIG,
    isAndroid: false,  // 关键：设为false以使用IndexedDB
    isWeb: true,       // 设为true确保使用Web存储
    isMobileWeb: true, // 标记为移动Web
    isMobileEdition: true, // 🔧 确保移动特性标志正确工作
    _originalIsAndroid: originalIsAndroid // 保存原始值以备需要
  };
  
  console.log('🔧 Android BUILD_CONFIG已修改:', (window as any).BUILD_CONFIG);
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

const storeManagerClient = createStoreManagerClient();
window.addEventListener('beforeunload', () => {
  storeManagerClient.dispose();
});

const future = {
  v7_startTransition: true,
} as const;

const framework = new Framework();
configureCommonModules(framework);
configureBrowserWorkbenchModule(framework);
configureLocalStorageStateStorageImpls(framework);
configureBrowserWorkspaceFlavours(framework);
configureMobileModules(framework);
framework.impl(NbstoreProvider, {
  openStore(key, options) {
    const { store, dispose } = storeManagerClient.open(key, options);
    return {
      store,
      dispose: () => {
        dispose();
      },
    };
  },
});
const frameworkProvider = framework.provider();

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

// 配置Android专用AuthProvider
configureAndroidAuthProvider(framework);

// 添加调试日志
console.log('=== 🤖 Android应用初始化 ===');

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
  
  // 创建新的Request对象，使用修改后的URL
  const modifiedRequest = new Request(url, request);
  
  console.log('=== 🌐 网络请求详情 ===');
  console.log('URL:', url);
  console.log('方法:', modifiedRequest.method);
  
  // 关键：检查Authorization头
  const headers = modifiedRequest.headers;
  console.log('Headers:', Object.fromEntries(headers.entries()));
  const authHeader = headers.get('Authorization');
  if (authHeader) {
    console.log('✅ JWT Token存在:', authHeader.substring(0, 30) + '...');
  } else {
    console.warn('⚠️ 没有JWT Token!');
  }
  
  // 解析完整URL
  let fullUrl;
  try {
    fullUrl = new URL(url);
    console.log('完整URL:', fullUrl.toString());
    console.log('目标主机:', fullUrl.hostname + ':' + (fullUrl.port || '80'));
  } catch (e) {
    console.error('URL解析失败:', e);
  }
  
  // 使用修改后的Request对象调用原始fetch
  return originalFetch.call(this, modifiedRequest)
    .then(response => {
      console.log('=== 📡 响应详情 ===');
      console.log('状态:', response.status, response.statusText);
      console.log('响应URL:', response.url);
      
      if (!response.ok) {
        console.error('❌ 请求失败 - 状态码:', response.status);
        if (response.status === 404) {
          console.error('❌ 404错误 - 接口不存在或路径错误');
        } else if (response.status === 401) {
          console.error('❌ 401错误 - 认证失败');
        } else if (response.status === 0) {
          console.error('❌ 网络连接失败 - 可能是CORS或服务器不可达');
        }
      }
      
      // 🔍 如果是workspaces相关请求，记录基本信息
      if (url.includes('/api/workspaces')) {
        console.log('🏢 工作区请求响应详情:');
        console.log('- 请求URL:', url);
        console.log('- 响应状态:', response.status);
        console.log('- Content-Type:', response.headers.get('content-type'));
        console.log('- Content-Length:', response.headers.get('content-length'));
        
        // 延迟检查WorkspacesService状态
        setTimeout(() => {
          try {
            const workspacesService = frameworkProvider.get(WorkspacesService);
            const currentWorkspaces = workspacesService.list.workspaces$.value;
            console.log('🏢 WorkspacesService状态检查:');
            console.log('- 工作区数量:', currentWorkspaces.length);
            
            if (currentWorkspaces.length > 0) {
              console.log('✅ 工作区数据已成功加载到WorkspacesService!');
            } else {
              console.warn('⚠️ WorkspacesService中暂时没有工作区数据');
            }
          } catch (e) {
            console.error('❌ 检查WorkspacesService失败:', e);
          }
        }, 3000);
      }
      
      return response;
    })
    .catch(error => {
      console.error('=== 🔴 网络异常 ===');
      console.error('错误:', error.message);
      console.error('请求URL:', url);
      
      // 修复：确保error.message存在且是字符串类型再调用includes
      if (error.message && typeof error.message === 'string' && error.message.includes('Failed to fetch')) {
        console.error('❌ 网络连接失败 - 检查服务器是否在192.168.31.28:8080运行');
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
(window as any).getCurrentServerBaseUrl = () => {
  const globalContextService = frameworkProvider.get(GlobalContextService);
  const currentServerId = globalContextService.globalContext.serverId.get();
  const serversService = frameworkProvider.get(ServersService);
  const defaultServerService = frameworkProvider.get(DefaultServerService);
  const currentServer =
    (currentServerId ? serversService.server$(currentServerId).value : null) ??
    defaultServerService.server;
  return currentServer.baseUrl;
};
(window as any).getCurrentI18nLocale = () => {
  return I18n.language;
};
(window as any).getCurrentWorkspaceId = () => {
  const globalContextService = frameworkProvider.get(GlobalContextService);
  return globalContextService.globalContext.workspaceId.get();
};
(window as any).getCurrentDocId = () => {
  const globalContextService = frameworkProvider.get(GlobalContextService);
  return globalContextService.globalContext.docId.get();
};
(window as any).getCurrentDocContentInMarkdown = async () => {
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
};

// setup application lifecycle events, and emit application start event
window.addEventListener('focus', () => {
  frameworkProvider.get(LifecycleService).applicationFocus();
});
frameworkProvider.get(LifecycleService).applicationStart();

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
      .get(DefaultServerService)
      .server.scope.get(AuthService);
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

function createStoreManagerClient() {
  const worker = new Worker(getWorkerUrl('nbstore'));
  
  // 移除原生DB API，只使用Web存储 + 云端Java后端
  // const { port1: nativeDBApiChannelServer, port2: nativeDBApiChannelClient } =
  //   new MessageChannel();
  // AsyncCall<typeof NbStoreNativeDBApis>(NbStoreNativeDBApis, {
  //   channel: {
  //     on(listener) {
  //       const f = (e: MessageEvent<any>) => {
  //         listener(e.data);
  //       };
  //       nativeDBApiChannelServer.addEventListener('message', f);
  //       return () => {
  //         nativeDBApiChannelServer.removeEventListener('message', f);
  //       };
  //     },
  //     send(data) {
  //       nativeDBApiChannelServer.postMessage(data);
  //     },
  //   },
  //   log: false,
  // });
  // nativeDBApiChannelServer.start();
  // worker.postMessage(
  //   {
  //     type: 'native-db-api-channel',
  //     port: nativeDBApiChannelClient,
  //   },
  //   [nativeDBApiChannelClient]
  // );
  
  return new StoreManagerClient(new OpClient(worker));
}
