import { style } from '@vanilla-extract/css';

export const statusBar = style({
  // 固定在底部
  position: 'absolute',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '32px',
  padding: '0 16px',
  backgroundColor: 'var(--yunke-v2-layer-background-secondary, rgba(0, 0, 0, 0.04))',
  borderRadius: '16px',
  border: '1px solid var(--yunke-v2-layer-border-primary, rgba(0, 0, 0, 0.06))',
  fontSize: '13px',
  color: 'var(--yunke-v2-text-secondary, #8E8D91)',
  zIndex: 5,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',

  ':hover': {
    backgroundColor: 'var(--yunke-v2-layer-background-hoverOverlay, rgba(0, 0, 0, 0.08))',
    color: 'var(--yunke-v2-text-primary, #1E1E1E)',
  },

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      height: '28px',
      padding: '0 12px',
      fontSize: '11px',
      bottom: '12px',
      borderRadius: '14px',
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
