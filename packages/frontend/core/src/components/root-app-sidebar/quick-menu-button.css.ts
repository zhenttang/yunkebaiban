import { style } from '@vanilla-extract/css';

export const quickMenuButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  color: 'var(--yunke-icon-color)',
  ':hover': {
    backgroundColor: 'var(--yunke-hover-color)',
    color: 'var(--yunke-primary-color)',
  },
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: 'var(--yunke-hover-color)',
      color: 'var(--yunke-primary-color)',
    },
  },
});
