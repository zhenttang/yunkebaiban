import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const copy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  fontSize: 15,
  lineHeight: '24px',
  maxWidth: 560,
  color: cssVarV2('text/secondary'),
});

export const highlightLink = style({
  color: cssVarV2('button/primary'),
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'opacity 0.2s ease',
  ':hover': {
    opacity: 0.85,
  },
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
});

export const licenseKeyContainer = style({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  padding: '12px 16px',
  gap: 12,
  boxShadow: cssVarV2('shadow/popover'),
});

export const icon = style({
  color: cssVarV2('icon/primary'),
});
