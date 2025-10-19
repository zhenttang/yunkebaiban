import '@yunke/env/constant';
import '@blocksuite/yunke/global/types'

declare module '@blocksuite/yunke/store' {
  interface DocMeta {
    /**
     * @deprecated
     */
    favorite?: boolean;
    trash?: boolean;
    trashDate?: number;
    updatedDate?: number;
    mode?: 'page' | 'edgeless';
    // 待办：将来支持 `number` 类型
    isPublic?: boolean;
  }
}


declare global {

declare type Environment = {
  // 变体
  isSelfHosted: boolean;

  // 设备
  isLinux: boolean;
  isMacOs: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isWindows: boolean;
  isFireFox: boolean;
  isMobile: boolean;
  isChrome: boolean;
  isPwa: boolean;
  chromeVersion?: number;

  // 运行时配置
  publicPath: string;
  subPath: string;
};

  var process: {
    env: Record<string, string>;
  };
  var environment: Environment;
  var $AFFINE_SETUP: boolean | undefined;
  /**
   * 通过 https://www.npmjs.com/package/@sentry/webpack-plugin 注入
   */
  var SENTRY_RELEASE: { id: string } | undefined;
}

// 为使用 webpack 的项目提供 import.meta.env 的类型补全
// 以便在 TS 环境下安全访问 VITE_* 风格的环境变量
declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL?: string;
    VITE_DRAWIO_URL?: string;
    VITE_SOCKETIO_URL?: string;
    MODE?: string;
    [key: string]: string | undefined;
  }

  interface ImportMeta {
    env: ImportMetaEnv;
  }
}
