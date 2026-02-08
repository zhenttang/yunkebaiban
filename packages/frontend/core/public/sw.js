/**
 * YUNKE Service Worker — PWA 离线缓存
 *
 * 策略:
 *   - 静态资源 (JS/CSS/fonts/images): CacheFirst — 缓存优先，加载快
 *   - HTML 导航请求:                   NetworkFirst — 网络优先，保证最新
 *   - API 请求:                       NetworkOnly  — 不缓存（数据通过 Yjs/IndexedDB 管理）
 *
 * 版本管理: 修改 CACHE_VERSION 即可触发全量缓存更新
 */

const CACHE_VERSION = 'yunke-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

// 预缓存的核心资源（应用外壳）
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-192.png',
];

// 不缓存的路径前缀
const NO_CACHE_PATHS = [
  '/api/',
  '/socket.io/',
  '/graphql',
  '/oauth/',
  '/auth/',
];

// 静态资源匹配（缓存优先）
function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  return (
    pathname.startsWith('/js/') ||
    pathname.startsWith('/css/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/imgs/') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    // Webpack 带 contenthash 的文件
    /\.[a-f0-9]{8}\.(js|css)$/.test(pathname)
  );
}

// 不应缓存的请求
function shouldSkipCache(url) {
  const pathname = new URL(url).pathname;
  return NO_CACHE_PATHS.some(prefix => pathname.startsWith(prefix));
}

// 是否是导航请求（HTML 页面）
function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
  );
}

// ====== 安装：预缓存核心资源 ======
self.addEventListener('install', event => {
  console.log('[SW] 安装中...', CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        // 尽力缓存预定义资源，失败不阻塞安装
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] 预缓存失败: ${url}`, err);
            })
          )
        );
      })
      .then(() => {
        // 立即激活，不等待旧 SW 退出
        return self.skipWaiting();
      })
  );
});

// ====== 激活：清理旧版本缓存 ======
self.addEventListener('activate', event => {
  console.log('[SW] 激活中...', CACHE_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => !key.startsWith(CACHE_VERSION))
            .map(key => {
              console.log('[SW] 清理旧缓存:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => {
        // 立即控制所有客户端
        return self.clients.claim();
      })
  );
});

// ====== 请求拦截 ======
self.addEventListener('fetch', event => {
  const { request } = event;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  // 只处理 http/https
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 跳过 API 和不应缓存的请求
  if (shouldSkipCache(request.url)) return;

  // 策略 1: 静态资源 — CacheFirst
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request)
            .then(response => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // 离线且没有缓存：返回空响应
              return new Response('', { status: 503, statusText: 'Offline' });
            });
        })
      )
    );
    return;
  }

  // 策略 2: 导航请求（HTML）— NetworkFirst
  if (isNavigationRequest(request)) {
    event.respondWith(
      caches.open(PAGES_CACHE).then(cache =>
        fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // 离线：尝试从缓存返回
            return cache.match(request).then(cached => {
              if (cached) return cached;
              // 最后回退：返回首页缓存（SPA）
              return cache.match('/').then(indexCache => {
                if (indexCache) return indexCache;
                return new Response(
                  '<!DOCTYPE html><html><body><h2>离线模式</h2><p>无法加载页面，请检查网络连接后刷新。</p><button onclick="location.reload()">重新加载</button></body></html>',
                  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
              });
            });
          })
      )
    );
    return;
  }
});

// ====== 消息处理：允许客户端控制缓存 ======
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    );
  }
});
