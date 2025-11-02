import { fallbackVar, style } from '@vanilla-extract/css';

import { globalVars } from '../../styles/variables.css';

export const root = style({
  // 与桌面整页登录保持接近的顶部留白
  padding: '72px 24px 24px',
  justifyContent: 'flex-start',
  minHeight: `calc(100dvh - ${fallbackVar(globalVars.appKeyboardHeight, '0px')})`,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  zIndex: 0,
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 16,
});
