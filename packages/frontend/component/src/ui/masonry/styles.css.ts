import { cssVarV2 } from '@toeverything/theme/v2';
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
  zIndex: 10,
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  // 使用和页面一致的背景色，避免透明导致内容重叠
  backgroundColor: cssVarV2('layer/background/primary'),
});
export const scrollbar = style({
  zIndex: 1,
});

export const item = style({
  position: 'absolute',
});
