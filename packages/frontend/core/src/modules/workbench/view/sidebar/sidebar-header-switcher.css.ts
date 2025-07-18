import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const iconContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  color: cssVar('iconColor'),
  
  // 添加悬停效果
  selectors: {
    '[data-state="checked"] &': {
      color: cssVar('primaryColor'),
      transform: 'scale(1.1)',
    },
    '[data-state="unchecked"]:hover &': {
      color: cssVar('textPrimaryColor'),
      transform: 'scale(1.05)',
    },
  },
});
