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
  background:
    'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(14, 165, 233, 0.12)) border-box, rgba(255, 255, 255, 0.95) padding-box',
  backgroundClip: 'padding-box, border-box',
  color: cssVar('textSecondaryColor'),
  cursor: 'not-allowed',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
  border: '1px solid transparent',
  transform: 'translateY(0)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  selectors: {
    '&[data-disabled]': {
      opacity: 1,
    },
    '&:hover': {
      background:
        'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.16)) border-box, rgba(255, 255, 255, 0.98) padding-box',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
      transform: 'translateY(-2px)',
    },
    '[data-theme="dark"] &': {
      background: 'rgba(17, 24, 39, 0.85)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      color: cssVar('textSecondaryColor'),
    },
    '[data-theme="dark"] &:hover': {
      background: 'rgba(17, 24, 39, 0.95)',
      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.25)',
      transform: 'translateY(-2px)',
    },
  },
});

export const placeholderIcon = style({
  width: '20px',
  height: '20px',
  color: cssVar('textSecondaryColor'),
  filter: 'drop-shadow(0 0 2px rgba(51, 102, 255, 0.2))',
  transition: 'all 0.3s ease',
});
