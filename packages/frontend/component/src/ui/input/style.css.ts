import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';
export const inputWrapper = style({
  width: '100%',
  height: 28,
  lineHeight: '22px',
  gap: '10px',
  color: cssVarV2('text/primary'),
  border: '1px solid',
  backgroundColor: cssVarV2('input/background'),
  borderRadius: 8,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: cssVar('fontBase'),
  boxSizing: 'border-box',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  selectors: {
    '&.no-border': {
      border: 'unset',
    },
    // size
    '&.large': {
      height: 32,
    },
    '&.extra-large': {
      height: 40,
      fontWeight: 600,
    },
    // color
    '&.disabled': {
      background: cssVarV2('layer/background/hoverOverlay'),
    },
    '&.error': {
      borderColor: cssVarV2('input/border/error'),
    },
    '&.success': {
      borderColor: cssVarV2('input/border/active'),
    },
    '&.warning': {
      borderColor: cssVarV2('input/border/error'),
    },
    '&.default': {
      borderColor: cssVarV2.layer.insideBorder.blackBorder,
    },
    '&.default:is(:focus-within, :focus, :focus-visible)': {
      borderColor: cssVarV2('button/primary'),
      outline: 'none',
      boxShadow:
        '0 0 0 3px rgba(51, 102, 255, 0.15), 0 2px 8px rgba(51, 102, 255, 0.12)',
    },
    '[data-theme="dark"] &.default:is(:focus-within, :focus, :focus-visible)': {
      borderColor: 'rgba(99, 102, 241, 0.6)',
      boxShadow:
        '0 0 0 3px rgba(99, 102, 241, 0.25), 0 2px 8px rgba(99, 102, 241, 0.18)',
    },
  },
});

export const mobileInputWrapper = style([
  inputWrapper,
  {
    height: 30,
    borderRadius: 4,
  },
]);

export const input = style({
  height: '100%',
  width: '0',
  flex: 1,
  boxSizing: 'border-box',
  padding: '0 12px',
  // prevent default style
  WebkitAppearance: 'none',
  WebkitTapHighlightColor: 'transparent',
  outline: 'none',
  border: 'none',
  background: 'transparent',
  selectors: {
    '&::placeholder': {
      color: cssVarV2('text/placeholder'),
    },
    '&:disabled': {
      color: cssVarV2('text/disable'),
    },
    '&:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 1000px ${cssVarV2('layer/white')} inset`,
    },
  },
});
