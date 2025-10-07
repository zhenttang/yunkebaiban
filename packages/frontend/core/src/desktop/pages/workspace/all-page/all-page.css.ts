import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
  width: '100%',
  containerName: 'docs-body',
  containerType: 'size',
});

export const mainContainer = style({
  width: '100%',
  margin: '0 auto',
  maxWidth: '1280px',
  padding: '0 40px 48px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  '@container': {
    'docs-body (width <= 1024px)': {
      padding: '0 32px 40px 32px',
    },
    'docs-body (width <= 768px)': {
      padding: '0 24px 32px 24px',
      gap: 18,
    },
    'docs-body (width <= 480px)': {
      padding: '0 16px 24px 16px',
      gap: 16,
    },
  },
});

export const banner = style({
  width: '100%',
});

export const card = style({
  borderRadius: 12,
  background: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
  boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.06)',
  transition: 'background-color .2s ease, border-color .2s ease',
});

export const pinnedCard = style([
  card,
  {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: cssVarV2('layer/background/secondary'),
  },
]);

export const filterCard = style([
  card,
  {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
]);

export const filterHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
});

export const filterSummary = style({
  fontSize: 14,
  color: cssVarV2('text/secondary'),
});

export const filterContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const filterControls = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const filterActionsSpacer = style({
  flex: 1,
});

export const filters = style({
  flex: 1,
});

export const documentsContainer = style([
  card,
  {
    background: cssVarV2('layer/background/secondary'),
    border: `1px solid ${cssVarV2('layer/outline/floating')}`,
    padding: '24px',
    minHeight: 320,
    '@container': {
      'docs-body (width <= 768px)': {
        padding: '18px',
      },
      'docs-body (width <= 500px)': {
        padding: '16px',
      },
    },
  },
]);

export const sectionTitle = style({
  fontSize: 14,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
});

export const scrollArea = style({
  height: 0,
  flex: 1,
});

export const documentsInner = style({
  width: '100%',
  height: '100%',
});
