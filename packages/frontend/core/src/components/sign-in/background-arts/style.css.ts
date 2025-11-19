import { style } from '@vanilla-extract/css';

import { float } from '../../../desktop/pages/auth/sign-in.css';

export const wrapper = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 0,
  '@media': {
    // C：系统减少动态时，直接隐藏背景艺术
    '(prefers-reduced-motion: reduce)': {
      display: 'none',
    },
  },
});

export const arts = style({
  width: 'min(1200px, 90%)',
  transform: 'translateY(-12%)',
  // B：降低默认不透明度，减轻视觉噪声
  opacity: 0.72,
  transition: 'opacity 0.3s ease',
  animation: `${float} 6s ease-in-out infinite`,
  '@media': {
    'screen and (max-width: 960px)': {
      // A：小屏不再展示动画，但保持可见度
      transform: 'translateY(-6%) scale(0.9)',
      opacity: 0.72,
      animation: 'none',
    },
    'screen and (max-width: 640px)': {
      transform: 'translateY(-4%) scale(0.8)',
      opacity: 0.72,
      animation: 'none',
    },
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      opacity: 0.0,
    },
  },
});
