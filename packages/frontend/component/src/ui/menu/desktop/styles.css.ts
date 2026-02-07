import { globalStyle, style } from '@vanilla-extract/css';

// 完全禁用菜单动画，防止图标飞行效果
export const contentAnimation = style({
  // 无动画
  animation: 'none !important',
  transition: 'none !important',
  selectors: {
    '&[data-state="closed"]': {
      pointerEvents: 'none',
      display: 'none !important',
    },
  },
});

// 禁用菜单内所有子元素的动画和过渡
globalStyle(`${contentAnimation} *`, {
  animation: 'none !important',
  transition: 'none !important',
});
