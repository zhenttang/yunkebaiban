import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  position: 'fixed',
  right: 24,
  bottom: 24,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  minWidth: 220,
  maxWidth: 320,
  borderRadius: 12,
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  boxShadow: cssVarV2('shadow/popover'),
  color: cssVarV2('text/primary'),
  backdropFilter: 'blur(16px)',
  transition: 'transform 0.2s ease, opacity 0.2s ease',
  selectors: {
    '&[data-hidden="true"]': {
      opacity: 0,
      pointerEvents: 'none',
      transform: 'translateY(8px)',
    },
  },
  '@media': {
    'screen and (max-width: 768px)': {
      right: 16,
      left: 16,
      maxWidth: 'unset',
      width: 'auto',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
  },
});

export const statusDot = style({
  width: 10,
  height: 10,
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor: 'var(--cloud-indicator-color)',
  transition: 'background-color 0.2s ease',
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: 1,
  minWidth: 0,
});

export const primaryText = style({
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '18px',
});

export const secondaryText = style({
  fontSize: 12,
  color: cssVarV2('text/tertiary'),
  lineHeight: '16px',
});

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  color: cssVarV2('pure/white'),
  backgroundColor: cssVarV2('status/warning'),
  minWidth: 28,
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const spacer = style({
  flex: 1,
});

export const closeButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  marginLeft: 8,
  padding: 0,
  border: 'none',
  borderRadius: 4,
  backgroundColor: 'transparent',
  color: cssVarV2('text/tertiary'),
  fontSize: 14,
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: cssVarV2('layer/background/hoverOverlay'),
    color: cssVarV2('text/primary'),
  },
  ':active': {
    transform: 'scale(0.95)',
  },
});
