import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const headerContainer = style({
  width: '100%',
  padding: '16px 40px 8px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  backgroundColor: cssVarV2('layer/background/primary'),
  borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
  '@container': {
    'docs-body (width <= 1024px)': {
      padding: '16px 32px 8px 32px',
    },
    'docs-body (width <= 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 16,
      padding: '16px 24px 8px 24px',
    },
    'docs-body (width <= 480px)': {
      padding: '12px 16px 6px 16px',
    },
  },
});

export const headerLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const headerRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  '@container': {
    'docs-body (width <= 768px)': {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
  },
});

export const actionGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const viewControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 6px',
  borderRadius: 999,
  backgroundColor: cssVarV2('layer/background/secondary'),
});

export const divider = style({
  width: 1,
  height: 24,
  backgroundColor: 'rgba(148, 163, 184, 0.4)',
});

export const viewToggle = style({
  backgroundColor: 'transparent',
});

export const viewToggleItem = style({
  padding: 0,
  fontSize: 16,
  width: 28,
  height: 28,
  color: cssVarV2.icon.primary,
  selectors: {
    '&[data-state=checked]': {
      color: cssVarV2('brand/primary'),
    },
  },
});

export const newPageButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 16px',
  height: 36,
  borderRadius: 999,
  backgroundColor: cssVarV2('brand/primary'),
  color: cssVarV2('text/inverse'),
  fontSize: 13,
  fontWeight: 600,
  boxShadow: '0px 10px 24px rgba(37, 99, 235, 0.25)',
  transition: 'transform .15s ease, box-shadow .15s ease',
  selectors: {
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0px 12px 30px rgba(37, 99, 235, 0.32)',
    },
    '&:focus-visible': {
      outline: `2px solid ${cssVarV2('brand/primary/strong')}`,
      outlineOffset: 2,
    },
  },
});

export const newPageButtonLabel = style({
  fontSize: 13,
  fontWeight: 600,
});
