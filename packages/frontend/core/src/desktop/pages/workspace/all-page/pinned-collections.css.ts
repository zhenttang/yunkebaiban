import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
});

export const track = style({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 4,
  scrollbarWidth: 'none',
  maskImage:
    'linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent)',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  flex: 1,
});

export const pill = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 18px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  color: cssVarV2('text/secondary'),
  backgroundColor: 'transparent',
  border: `1px solid transparent`,
  cursor: 'pointer',
  transition: 'background-color .15s ease, color .15s ease',
  userSelect: 'none',
  selectors: {
    '&:hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      color: cssVarV2('text/primary'),
    },
    '&[data-active="true"]': {
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      borderColor: 'rgba(59, 130, 246, 0.28)',
      color: cssVarV2('brand/primary/strong'),
    },
  },
});

export const pillLabel = style({
  maxWidth: 160,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

export const pillIndicator = style({
  position: 'absolute',
  left: 12,
  right: 12,
  bottom: 4,
  height: 2,
  borderRadius: 999,
  backgroundColor: cssVarV2('brand/primary'),
  opacity: 0,
  transition: 'opacity .2s ease',
  selectors: {
    [`${pill}[data-active="true"] &`]: {
      opacity: 1,
    },
  },
});

export const addButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 999,
  border: '1px dashed rgba(59,130,246,0.5)',
  color: cssVarV2('brand/primary'),
  fontSize: 13,
  cursor: 'pointer',
  background: 'rgba(59,130,246,0.08)',
  transition: 'background-color .15s ease',
  selectors: {
    '&:hover': {
      background: 'rgba(59,130,246,0.12)',
    },
  },
});

export const trailingActions = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
});

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: 999,
  color: cssVarV2('icon/secondary'),
  selectors: {
    '&:hover': {
      color: cssVarV2('icon/primary'),
      backgroundColor: 'rgba(15, 23, 42, 0.06)',
    },
  },
});
