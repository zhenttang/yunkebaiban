import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const panel = style({
  marginBottom: 24,
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
});

export const card = style({
  borderRadius: 20,
  padding: 20,
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
});

export const cardAccent = style({
  position: 'absolute',
  insetInlineEnd: -32,
  insetBlockStart: -32,
  width: 128,
  height: 128,
  borderBottomLeftRadius: 999,
  background:
    'radial-gradient(circle at 0% 100%, rgba(79, 70, 229, 0.14), transparent 60%)',
  opacity: 0.9,
  pointerEvents: 'none',
});

export const iconWrapper = style({
  width: 48,
  height: 48,
  borderRadius: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
  transition: 'transform 0.2s ease, background 0.2s ease, color 0.2s ease',

  selectors: {
    [`${card}:hover &`]: {
      transform: 'scale(1.05)',
    },
  },
});

export const title = style({
  fontSize: 16,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
});

export const description = style({
  marginTop: 6,
  fontSize: 13,
  lineHeight: '20px',
  color: cssVarV2('text/secondary'),
});

export const hintRow = style({
  marginTop: 12,
  fontSize: 12,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  columnGap: 4,
  opacity: 0,
  transform: 'translateY(4px)',
  transition: 'opacity 0.2s ease, transform 0.2s ease',

  selectors: {
    [`${card}:hover &`]: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
});

