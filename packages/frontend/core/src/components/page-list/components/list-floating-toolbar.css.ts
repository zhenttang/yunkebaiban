import { style } from '@vanilla-extract/css';

export const floatingToolbar = style({
  position: 'fixed',
  bottom: '32px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  pointerEvents: 'auto',
  
  // 确保在移动设备上也能正确显示
  '@media': {
    '(max-width: 768px)': {
      bottom: '24px',
      left: '16px',
      right: '16px',
      transform: 'none',
      width: 'calc(100% - 32px)',
    },
  },
});
