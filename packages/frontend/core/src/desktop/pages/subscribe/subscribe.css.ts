import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const page = style({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
  background: cssVarV2('layer/background/primary'),
});

export const panel = style({
  width: 'min(480px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: '32px',
  borderRadius: 20,
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  background: cssVarV2('layer/background/secondary'),
  boxShadow: cssVarV2('shadow/popover'),
  '@media': {
    'screen and (max-width: 540px)': {
      padding: '24px',
      gap: 20,
    },
  },
});

export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const title = style({
  fontSize: 22,
  fontWeight: 700,
  color: cssVarV2('text/primary'),
});

export const description = style({
  fontSize: 14,
  lineHeight: '22px',
  color: cssVarV2('text/secondary'),
});

export const statusCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '18px 20px',
  borderRadius: 16,
  background: cssVarV2('layer/background/tertiary'),
  color: cssVarV2('text/primary'),
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
  selectors: {
    '&[data-variant="error"]': {
      background: cssVarV2('layer/background/error'),
      color: cssVarV2('status/error'),
      borderColor: cssVarV2('status/error'),
    },
  },
});

export const statusContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: 1,
  minWidth: 0,
});

export const statusTitle = style({
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '22px',
});

export const statusText = style({
  fontSize: 13,
  lineHeight: '20px',
  color: cssVarV2('text/secondary'),
  selectors: {
    [`${statusCard}[data-variant="error"] &`]: {
      color: 'inherit',
    },
  },
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
});

export const helper = style({
  fontSize: 12,
  lineHeight: '18px',
  color: cssVarV2('text/tertiary'),
});
