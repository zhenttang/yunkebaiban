import { openDB } from 'idb';
// 🔧 Android 离线模式：不导入 getSocketIOUrl，避免触发环境变量检查
// import { getSocketIOUrl } from '@yunke/config';

/**
 * the below code includes the custom fetch and xmlhttprequest implementation for ios webview.
 * should be included in the entry file of the app or webworker.
 */
const rawFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = new Request(input, init);

  const origin = new URL(request.url, globalThis.location.origin).origin;

  const token = await readEndpointToken(origin);
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }

  return rawFetch(request);
};

// 🔧 Android 离线模式：禁用 Socket.IO 检测
// 不再在启动时检查 Socket.IO 可用性，避免网络请求超时卡顿
// 用户需要云同步时，使用设置中的外部存储（S3）功能
console.log('🔧 Android 离线模式：已禁用 Socket.IO 自动检测');

// 🔧 临时禁用XMLHttpRequest拦截器，因为它阻塞了Socket.IO
// 但先添加一个调试拦截器来确认请求类型
const rawXMLHttpRequest = globalThis.XMLHttpRequest;
globalThis.XMLHttpRequest = class extends rawXMLHttpRequest {
  private pendingUrl: string | undefined;
  
  override open(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null): void {
    this.pendingUrl = typeof url === 'string' ? url : url.toString();
    console.log('🔍 XHR Open:', method, this.pendingUrl);
    return super.open(method, url, async, user, password);
  }
  
  override send(body?: Document | XMLHttpRequestBodyInit | null): void {
    console.log('🔍 XHR Send:', this.pendingUrl);
    // 直接发送所有请求，不做任何拦截
    return super.send(body);
  }
};

console.log('🔧 Android代理已加载 - XMLHttpRequest拦截器设为透明模式');

export async function readEndpointToken(
  endpoint: string
): Promise<string | null> {
  const idb = await openDB('yunke-token', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens', { keyPath: 'endpoint' });
      }
    },
  });

  const token = await idb.get('tokens', endpoint);
  return token ? token.token : null;
}

export async function writeEndpointToken(endpoint: string, token: string) {
  const db = await openDB('yunke-token', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens', { keyPath: 'endpoint' });
      }
    },
  });

  await db.put('tokens', { endpoint, token });
}
