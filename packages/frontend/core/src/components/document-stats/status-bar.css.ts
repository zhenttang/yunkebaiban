import { style } from '@vanilla-extract/css';

export const statusBar = style({
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 20px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '18px',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  fontSize: '13px',
  color: '#8E8D91',
  zIndex: 10,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',

  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    transform: 'translateX(-50%) translateY(-2px)',
    color: '#1E1E1E',
  },

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      height: '28px',
      padding: '0 12px',
      fontSize: '11px',
      bottom: '16px',
      borderRadius: '14px',
      boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)',
    },
  },
});

export const statsText = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',

  // 移动端适配：减小间距
  '@media': {
    'screen and (max-width: 768px)': {
      gap: '8px',
    },
  },
});

export const separator = style({
  color: 'rgba(0, 0, 0, 0.2)',
  fontWeight: 300,
});

export const statItem = style({
  fontWeight: 400,
});
