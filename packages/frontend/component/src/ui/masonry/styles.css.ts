import { style } from '@vanilla-extract/css';

export const root = style({
  position: 'relative',
  selectors: {
    '&.scrollable': {
      overflowY: 'auto',
    },
  },
});

export const groupHeader = style({
  zIndex: 1,
});

export const stickyGroupHeader = style({
  zIndex: 10, // 提高 z-index，确保 sticky header 在最上层
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  // 添加背景色，避免透过下方内容
  backgroundColor: 'var(--affine-background-primary-color)',
  // 添加轻微阴影，增强视觉区分度
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
});
export const scrollbar = style({
  zIndex: 1,
});

export const item = style({
  position: 'absolute',
});
