import { useLayoutEffect } from 'react';

import { useThemeValueV1, useThemeValueV2 } from './use-theme-value';

let meta: HTMLMetaElement | null = null;

function getMeta() {
  if (meta) return meta;

  const exists = document.querySelector('meta[name="theme-color"]');
  if (exists) {
    meta = exists as HTMLMetaElement;
    return meta;
  }

  // 创建并添加 meta 标签
  meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.append(meta);
  return meta;
}

export const useThemeColorMeta = (color: string) => {
  useLayoutEffect(() => {
    const meta = getMeta();
    const old = meta.content;
    meta.content = color;
    // 同时修改文档背景（用于过度滚动弹跳效果）
    const oldBg = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = color;

    return () => {
      meta.content = old;
      document.documentElement.style.backgroundColor = oldBg;
    };
  }, [color]);
};

export const useThemeColorV1 = (
  ...args: Parameters<typeof useThemeValueV1>
) => {
  useThemeColorMeta(useThemeValueV1(...args));
};

export const useThemeColorV2 = (
  ...args: Parameters<typeof useThemeValueV2>
) => {
  useThemeColorMeta(useThemeValueV2(...args));
};
