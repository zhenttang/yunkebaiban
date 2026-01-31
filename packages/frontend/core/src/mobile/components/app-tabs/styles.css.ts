import { cssVarV2 } from '@toeverything/theme/v2';
import { createVar, style, globalStyle } from '@vanilla-extract/css';

import { globalVars } from '../../styles/variables.css';

export const appTabsBackground = createVar('appTabsBackground');

// 🎨 主题感知的背景渐变
export const themeAwareTabsBackground = style({
  vars: {
    [appTabsBackground]: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)', // 亮色主题：柔和灰蓝渐变
  },
});

// 🌙 暗色主题的背景渐变
globalStyle(`[data-theme="dark"] .${themeAwareTabsBackground}`, {
  vars: {
    [appTabsBackground]: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)', // 暗色主题：柔和深蓝灰渐变
  },
});

export const appTabs = style([
  themeAwareTabsBackground,
  {
    background: appTabsBackground, // 使用主题感知的背景
    borderTop: `0.5px solid ${cssVarV2.layer.insideBorder.border}`,

    width: '100dvw',

    zIndex: 1,

    marginBottom: -2,
    selectors: {
      '&[data-fixed="true"]': {
        position: 'fixed',
        bottom: -2,
        marginBottom: 0,
      },
    },
  },
]);
export const appTabsInner = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 15.5,

  height: `calc(${globalVars.appTabHeight} + 2px)`,
  padding: '13px 16px',
});
export const tabItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 0,
  flex: 1,
  height: 36,
  padding: 3,
  fontSize: 30,
  color: cssVarV2.icon.primary, // 🎨 使用主题变量，在暗色/亮色模式下自动适配
  lineHeight: 0,
  transition: 'all 0.2s ease',

  selectors: {
    '&[data-active="true"]': {
      color: cssVarV2.button.primary, // 🎨 激活状态使用主题的主要按钮颜色
      transform: 'scale(1.1)',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))', // 添加阴影增强对比度
    },
    '&:hover': {
      color: cssVarV2.icon.primary,
      opacity: 0.8,
    },
  },
});
