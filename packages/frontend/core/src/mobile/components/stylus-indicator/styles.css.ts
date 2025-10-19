import { cssVarV2 } from '@toeverything/theme/v2';
import { keyframes, style } from '@vanilla-extract/css';

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.6 },
});

const slideIn = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(10px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

export const indicator = style({
  position: 'fixed',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: cssVarV2('layer/background/primary'),
  border: `1.5px solid ${cssVarV2('layer/insideBorder/border')}`,
  borderRadius: 20,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  animation: `${slideIn} 0.3s ease-out`,
  cursor: 'pointer',
  userSelect: 'none',
  
  ':hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
  
  ':active': {
    transform: 'scale(0.98)',
  },
  
  selectors: {
    '&[data-active="true"]': {
      borderColor: cssVarV2('button/primary'),
      background: `linear-gradient(135deg, ${cssVarV2('layer/background/primary')} 0%, ${cssVarV2('layer/background/secondary')} 100%)`,
    },
  },
});

// 位置变体
export const topLeft = style({
  top: 80,
  left: 16,
});

export const topRight = style({
  top: 80,
  right: 16,
});

export const bottomLeft = style({
  bottom: 80,
  left: 16,
});

export const bottomRight = style({
  bottom: 80,
  right: 16,
});

export const iconContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
});

export const icon = style({
  width: 20,
  height: 20,
  color: cssVarV2('icon/primary'),
  transition: 'color 0.3s ease',
  
  selectors: {
    '[data-active="true"] &': {
      color: cssVarV2('button/primary'),
      animation: `${pulse} 2s ease-in-out infinite`,
    },
  },
});

export const details = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const status = style({
  fontSize: 12,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  whiteSpace: 'nowrap',
});

export const stats = style({
  display: 'flex',
  gap: 8,
  fontSize: 11,
  color: cssVarV2('text/secondary'),
  fontFamily: 'monospace',
});

export const tooltip = style({
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: 8,
  padding: '6px 10px',
  background: 'rgba(0, 0, 0, 0.85)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity 0.2s ease',

  '::before': {
    content: '""',
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: '4px solid rgba(0, 0, 0, 0.85)',
  },

  selectors: {
    [`${indicator}:hover &`]: {
      opacity: 1,
    },
  },
});

