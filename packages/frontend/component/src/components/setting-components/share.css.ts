import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

export const settingHeader = style({
  borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
  paddingBottom: '18px',
  marginBottom: '24px',
  whiteSpace: 'pre-wrap',
});

globalStyle(`${settingHeader} .title`, {
  fontSize: 18,
  fontWeight: 700,
  lineHeight: '26px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  position: 'relative',
  color: cssVarV2('text/primary'),
});

globalStyle(`${settingHeader} .subtitle`, {
  paddingTop: '6px',
  fontSize: 13,
  lineHeight: '20px',
  color: cssVarV2('text/secondary'),
});

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  padding: '24px',
  borderRadius: '18px',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  boxShadow: cssVarV2('shadow/popover'),
  marginBottom: '24px',
  selectors: {
    '&:last-of-type': {
      marginBottom: 0,
    },
  },
});

export const wrapperDisabled = style({
  opacity: 0.55,
  pointerEvents: 'none',
  filter: 'grayscale(0.1)',
});

globalStyle(`${wrapper} .title`, {
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  color: cssVarV2('text/secondary'),
});

globalStyle(`${wrapper} .description`, {
  fontSize: 12,
  lineHeight: '20px',
  color: cssVarV2('text/tertiary'),
});

export const settingRow = style({
  display: 'block',
  padding: '12px 16px',
  borderRadius: '12px',
  transition: 'background-color 0.2s ease, transform 0.2s ease',
  selectors: {
    '&.two-col': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
    },
    '&:not(.disabled):hover': {
      backgroundColor: cssVarV2('layer/background/hoverOverlay'),
    },
    '&.disabled': {
      position: 'relative',
    },
    '&.disabled::after': {
      content: '',
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderRadius: '12px',
    },
  },
  '@media': {
    'screen and (max-width: 720px)': {
      selectors: {
        '&.two-col': {
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '12px',
          gap: '12px',
          width: '100%',
        },
      },
    },
  },
});

globalStyle(`${settingRow} .left-col`, {
  flex: 1,
  minWidth: 0,
});

globalStyle(`${settingRow}.two-col .left-col`, {
  flexShrink: 0,
  maxWidth: '75%',
  '@media': {
    'screen and (max-width: 720px)': {
      maxWidth: '100%',
    },
  },
});

globalStyle(`${settingRow} .name`, {
  marginBottom: '4px',
  fontSize: 14,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
});

globalStyle(`${settingRow} .desc`, {
  fontSize: 12,
  color: cssVarV2('text/secondary'),
});

globalStyle(`${settingRow} .right-col`, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingLeft: '16px',
  gap: '12px',
  flexShrink: 0,
  '@media': {
    'screen and (max-width: 720px)': {
      width: '100%',
      paddingLeft: 0,
      marginTop: '12px',
      justifyContent: 'flex-start',
    },
  },
});

export const settingHeaderBeta = style({
  fontSize: 11,
  background: cssVarV2('chip/label/blue'),
  padding: '0 8px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 20,
  color: cssVarV2('text/inverse'),
});
