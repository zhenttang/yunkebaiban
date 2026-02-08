import { UaHelper } from './ua-helper.js';

// ====== 基础环境检测常量 ======
// 替代散落在代码各处的 typeof window === 'undefined' 检查

/** 是否在浏览器环境中（有 window 对象） */
export const isBrowser = typeof window !== 'undefined';

/** 是否在服务端/Worker 环境（无 window 对象） */
export const isServer = typeof window === 'undefined';

/** 是否有 navigator（浏览器或 Service Worker） */
export const hasNavigator = typeof navigator !== 'undefined';

/** 当前是否在线（无 navigator 时默认 true） */
export const isOnline = (): boolean =>
  hasNavigator ? navigator.onLine : true;

interface Environment {
  isLinux: boolean;
  isMacOs: boolean;
  isSafari: boolean;
  isWindows: boolean;
  isFireFox: boolean;
  isChrome: boolean;
  isIOS: boolean;
  isPwa: boolean;
  isMobile: boolean;
  isSelfHosted: boolean;
  publicPath: string;
  subPath: string;
  chromeVersion?: number;
}

declare global {
  var environment: Environment;
  var $YUNKE_SETUP: boolean;
}

export function setupGlobal() {
  if (globalThis.$YUNKE_SETUP) {
    return;
  }

  let environment: Environment = {
    isLinux: false,
    isMacOs: false,
    isSafari: false,
    isWindows: false,
    isFireFox: false,
    isChrome: false,
    isIOS: false,
    isPwa: false,
    isMobile: false,
    isSelfHosted: false,
    // publicPath 是资源文件的根路径
    publicPath: '/',
    // subPath 是访问 yunke 服务的路径
    subPath: ''
  };

  if (globalThis.navigator) {
    const uaHelper = new UaHelper(globalThis.navigator);

    environment = {
      ...environment,
      isMobile: uaHelper.isMobile,
      isLinux: uaHelper.isLinux,
      isMacOs: uaHelper.isMacOs,
      isSafari: uaHelper.isSafari,
      isWindows: uaHelper.isWindows,
      isFireFox: uaHelper.isFireFox,
      isChrome: uaHelper.isChrome,
      isIOS: uaHelper.isIOS,
      isPwa: uaHelper.isStandalone,
    };
    // iOS 上的 Chrome 仍然是 Safari
    if (environment.isChrome && !environment.isIOS) {
      environment = {
        ...environment,
        isSafari: false,
        isFireFox: false,
        isChrome: true,
        chromeVersion: uaHelper.getChromeVersion(),
      };
    }
  }

  applyEnvironmentOverrides(environment);

  globalThis.environment = environment;
  globalThis.$YUNKE_SETUP = true;
}

function applyEnvironmentOverrides(environment: Environment) {
  if (typeof document === 'undefined') {
    return;
  }

  const metaTags = document.querySelectorAll('meta');

  metaTags.forEach(meta => {
    if (!meta.name.startsWith('env:')) {
      return;
    }

    const name = meta.name.substring(4);

    // 所有环境变量都应该有默认值
    // 因此忽略未定义的覆盖值
    if (name in environment) {
      (environment as any)[name] =
        typeof (environment as any)[name] === 'string'
          ? meta.content
          : JSON.parse(meta.content);
    }
  });
}
