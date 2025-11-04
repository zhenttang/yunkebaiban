import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';
import { keyframes } from '@vanilla-extract/css';

// 淡入动画
const fadeIn = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translateY(10px)',
  },
  '100%': {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  gap: '24px',
  padding: '20px',
  boxSizing: 'border-box',
  backgroundColor: cssVarV2('layer/background/primary'),
  animation: `${fadeIn} 0.4s ease-out`,
});

export const loadingWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${fadeIn} 0.5s ease-out 0.1s both`,
});

export const textContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  animation: `${fadeIn} 0.5s ease-out 0.2s both`,
});

export const title = style({
  fontSize: '16px',
  fontWeight: 500,
  color: cssVarV2('text/primary'),
  margin: 0,
  lineHeight: '24px',
});

export const hint = style({
  fontSize: '14px',
  color: cssVarV2('text/secondary'),
  margin: 0,
  lineHeight: '20px',
});
