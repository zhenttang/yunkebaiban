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
