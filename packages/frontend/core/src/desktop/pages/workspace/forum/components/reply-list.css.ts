import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const wrapper = style({
  marginTop: 24,
});

export const count = style({
  margin: '0 0 10px',
  fontSize: 16,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
});

export const reply = style({
  borderTop: `1px solid ${cssVarV2('layer/border')}`,
  padding: '14px 0',
});

export const replyHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const authorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const author = style({
  color: cssVarV2('text/primary'),
});

export const floor = style({
  color: cssVarV2('text/tertiary'),
  fontSize: 12,
});

export const bestBadge = style({
  color: '#52c41a',
  fontSize: 12,
});

export const actionRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const likeBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
});

export const likeHeart = style({});

export const markBtn = style({
  fontSize: 12,
});

export const replyContent = style({
  marginTop: 8,
});

export const replyMeta = style({
  marginTop: 6,
  color: cssVarV2('text/tertiary'),
  fontSize: 12,
});

export const pagination = style({
  marginTop: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
});


