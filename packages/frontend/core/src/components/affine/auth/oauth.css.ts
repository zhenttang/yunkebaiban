import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const placeholderButton = style({
  width: '100%',
  justifyContent: 'flex-start',
  padding: '14px 20px',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.04)',
  color: cssVar('textSecondaryColor'),
  cursor: 'not-allowed',
  boxShadow: 'none',
  border: '1px dashed rgba(15, 23, 42, 0.08)',
  transition: 'background 0.2s ease',
  selectors: {
    '&[data-disabled]': {
      opacity: 1,
    },
    '&:hover': {
      background: 'rgba(15, 23, 42, 0.06)',
    },
  },
});

export const placeholderIcon = style({
  width: '20px',
  height: '20px',
  color: cssVar('textSecondaryColor'),
});
