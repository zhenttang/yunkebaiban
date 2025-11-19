import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const glassSurface = style({
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRight: '1px solid rgba(15, 23, 42, 0.06)',
});

export const glassCard = style({
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 4px 30px rgba(15, 23, 42, 0.06)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.9)',
      boxShadow:
        '0 20px 40px -10px rgba(79, 70, 229, 0.25), 0 0 0 1px rgba(79, 70, 229, 0.08)',
      transform: 'translateY(-4px)',
    },
  },
});

export const navItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px 8px 18px',
  borderRadius: 12,
  color: cssVarV2('text/secondary'),
  fontSize: 13,
  cursor: 'pointer',
  transition: 'background 0.15s ease, color 0.15s ease',

  selectors: {
    '&:hover': {
      background: 'rgba(148, 163, 184, 0.08)',
      color: cssVarV2('text/primary'),
    },
  },
});

export const navItemActive = style([
  navItem,
  {
    position: 'relative',
    color: cssVarV2('text/brand'),
    background:
      'linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',

    selectors: {
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 6,
        bottom: 6,
        width: 3,
        borderRadius: 999,
        backgroundColor: cssVarV2('border/brand'),
      },
    },
  },
]);
