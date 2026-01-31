import { cssVarV2 } from '@toeverything/theme/v2';
import { createVar, style, globalStyle } from '@vanilla-extract/css';

import { globalVars } from '../../styles/variables.css';

export const curvedTabsBackground = createVar('curvedTabsBackground');

// 🎨 主题感知的背景渐变
export const themeAwareBackground = style({
  vars: {
    [curvedTabsBackground]: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)', // 亮色主题：柔和灰蓝渐变
  },
});

// 🌙 暗色主题的背景渐变
globalStyle(`[data-theme="dark"] .${themeAwareBackground}`, {
  vars: {
    [curvedTabsBackground]: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)', // 暗色主题：柔和深蓝灰渐变
  },
});

export const curvedTabs = style([
  themeAwareBackground,
  {
    position: 'relative',
    width: '100dvw',
    zIndex: 1,
    marginBottom: -2,
    background: curvedTabsBackground, // 使用主题感知的背景
    selectors: {
      '&[data-fixed="true"]': {
        position: 'fixed',
        bottom: -2,
        marginBottom: 0,
        left: 0,
        right: 0,
      },
    },
  },
]);

export const curvedTabsInner = style({
  height: `calc(${globalVars.appTabHeight} + 2px)`,
  position: 'relative',
});

export const svgWrap = style({
  position: 'absolute',
  left: 0,
  right: 0,
});

export const buttonsRow = style({
  position: 'absolute',
  left: 0,
  right: 0,
  display: 'flex',
  height: 100, // clickable area similar to flutter sample
});

export const buttonCell = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  willChange: 'transform, opacity',
  transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
  transform: 'translateZ(0)',
});

export const floating = style({
  position: 'absolute',
  width: 52,
  height: 52,
  borderRadius: 26,
  background: cssVarV2('layer/background/primary'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  willChange: 'transform, left, bottom',
  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), left 0.45s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
  transform: 'translateZ(0)',
});

export const iconStyle = style({
  fontSize: 30,
  lineHeight: 0,
  color: cssVarV2.icon.primary, // 🎨 使用主题变量，在暗色/亮色模式下自动适配
  transition: 'all 0.2s ease',
  selectors: {
    '&[data-active="true"]': {
      color: cssVarV2.button.primary, // 🎨 激活状态使用主题的主要按钮颜色
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))', // 添加阴影增强对比度
    },
    '&:hover': {
      color: cssVarV2.icon.primary,
      opacity: 0.8,
    },
  },
});
