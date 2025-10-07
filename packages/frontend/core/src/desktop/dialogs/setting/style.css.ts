import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const wrapper = style({
  vars: {
    '--setting-modal-width': 'min(720px, 100%)',
    '--setting-modal-height': '720px',
    '--setting-modal-content-width': 'min(720px, 100%)',
    '--setting-modal-gap-x': '0px',
  },
  height: '100%',
  padding: 'clamp(24px, 6vh, 40px) clamp(12px, 5vw, 36px) 24px',
  display: 'flex',
  gap: 'clamp(16px, 4vw, 32px)',
  backgroundColor: cssVarV2('layer/background/primary'),
});

export const centerContainer = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  minHeight: '100%',
});

export const content = style({
  position: 'relative',
  width: '100%',
  marginBottom: '24px',
  minHeight: 'min(calc(var(--setting-modal-height, 720px) - 124px), 100%)',
  maxWidth: 'min(720px, 100%)',
  padding: '32px clamp(16px, 4vw, 48px) 24px',
});

export const suggestionLink = style({
  fontSize: 14,
  color: cssVarV2('text/primary'),
  display: 'flex',
  alignItems: 'start',
  lineHeight: '22px',
  gap: '12px',
});

export const suggestionLinkIcon = style({
  color: cssVarV2('icon/secondary'),
  marginRight: '12px',
  display: 'flex',
  margin: '3px 0',
});

export const footer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingBottom: '12px',
  gap: '8px',
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
  flexWrap: 'wrap',
  maxWidth: 'min(720px, 100%)',
});

export const link = style({
  color: cssVarV2('button/primary'),
  cursor: 'pointer',
  fontWeight: 600,
});

export const centeredLoading = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  width: '100%',
});
