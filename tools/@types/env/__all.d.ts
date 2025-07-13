import '@affine/env/constant';
import '@blocksuite/affine/global/types'

declare module '@blocksuite/affine/store' {
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
