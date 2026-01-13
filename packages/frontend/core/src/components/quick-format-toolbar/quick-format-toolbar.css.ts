import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 12px',
  background: cssVarV2('layer/background/secondary'),
  borderBottom: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
});

export const disabled = style({
  opacity: 0.5,
  pointerEvents: 'none',
});

export const button = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '32px',
  padding: 0,
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  color: cssVarV2('text/primary'),
  cursor: 'pointer',
  transition: 'all 0.15s',

  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
    transform: 'translateY(-1px)',
  },

  ':active': {
    transform: 'translateY(0)',
  },

  ':disabled': {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
});
