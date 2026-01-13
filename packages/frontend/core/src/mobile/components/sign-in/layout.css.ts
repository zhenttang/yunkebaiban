import { fallbackVar, style } from '@vanilla-extract/css';

import { globalVars } from '../../styles/variables.css';

export const root = style({
  // 让登录卡片在竖屏居中，不会顶到顶部，底部留白明显减少
  padding: '32px 20px 48px',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: `calc(100dvh - ${fallbackVar(globalVars.appKeyboardHeight, '0px')})`,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  position: 'relative',
  zIndex: 0,
});

export const content = style({
  width: 'min(480px, 100%)',
  padding: '20px 18px 24px',
  borderRadius: 18,
  background: 'rgba(255, 255, 255, 0.86)',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.12)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 16,
  selectors: {
    '[data-theme="dark"] &': {
      background: 'rgba(18, 18, 20, 0.82)',
      boxShadow: '0 24px 82px rgba(0, 0, 0, 0.48)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    },
  },
});
