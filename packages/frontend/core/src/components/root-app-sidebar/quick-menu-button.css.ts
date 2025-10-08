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
  color: 'var(--affine-icon-color)',
  ':hover': {
    backgroundColor: 'var(--affine-hover-color)',
    color: 'var(--affine-primary-color)',
  },
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: 'var(--affine-hover-color)',
      color: 'var(--affine-primary-color)',
    },
  },
});
