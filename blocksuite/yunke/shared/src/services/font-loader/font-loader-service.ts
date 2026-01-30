import { createIdentifier } from '@blocksuite/global/di';
import { IS_FIREFOX } from '@blocksuite/global/env';
import { LifeCycleWatcher } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';

import type { FontConfig } from './config.js';

/**
 * 检测是否为 Android 环境
 */
function isAndroidEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // 检查 BUILD_CONFIG
  const buildConfig = (window as any).BUILD_CONFIG;
  if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
    return true;
  }
  
  // 检查 Capacitor
  try {
    const Capacitor = (window as any).Capacitor;
    if (Capacitor?.getPlatform?.() === 'android') {
      return true;
    }
  } catch {
    // Capacitor 可能不可用
  }
  
  return false;
}

/**
 * 处理字体 URL
 * Android 环境下保持使用绝对 URL（CDN），不被 Capacitor 转换
 */
function processFontUrl(url: string): string {
  // Android 环境下，如果已经是绝对 URL（http/https），直接返回
  // 这样 Capacitor 就不会将其转换为 localhost
  if (isAndroidEnvironment() && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return url;
}

const initFontFace = IS_FIREFOX
  ? ({ font, weight, url, style }: FontConfig) =>
      new FontFace(`"${font}"`, `url(${processFontUrl(url)})`, {
        weight,
        style,
      })
  : ({ font, weight, url, style }: FontConfig) =>
      new FontFace(font, `url(${processFontUrl(url)})`, {
        weight,
        style,
      });

export class FontLoaderService extends LifeCycleWatcher {
  static override readonly key = 'font-loader';

  readonly fontFaces: FontFace[] = [];

  get ready() {
    return Promise.all(this.fontFaces.map(fontFace => fontFace.loaded));
  }

  load(fonts: FontConfig[]) {
    this.fontFaces.push(
      ...fonts.map(font => {
        const fontFace = initFontFace(font);
        document.fonts.add(fontFace);
        // 静默处理字体加载错误，不打印到控制台
        fontFace.load().catch(() => {
          // 字体加载失败时静默忽略，使用系统默认字体作为后备
        });
        return fontFace;
      })
    );
  }

  override mounted() {
    const config = this.std.getOptional(FontConfigIdentifier);
    if (config) {
      this.load(config);
    }
  }

  override unmounted() {
    this.fontFaces.forEach(fontFace => document.fonts.delete(fontFace));
    this.fontFaces.splice(0, this.fontFaces.length);
  }
}

export const FontConfigIdentifier =
  createIdentifier<FontConfig[]>('YunkeFontConfig');

export const FontConfigExtension = (
  fontConfig: FontConfig[]
): ExtensionType => ({
  setup: di => {
    di.addImpl(FontConfigIdentifier, () => fontConfig);
  },
});
