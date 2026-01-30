import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  width: '100%',
  containerName: 'collection-body',
  containerType: 'size',
});

export const mainContainer = style({
  width: '100%',
  margin: '0 auto',
  maxWidth: '1280px',
  padding: '0 40px 48px 40px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  '@container': {
    'collection-body (width <= 1024px)': {
      padding: '0 32px 40px 32px',
    },
    'collection-body (width <= 768px)': {
      padding: '0 24px 32px 24px',
    },
    'collection-body (width <= 480px)': {
      padding: '0 16px 24px 16px',
    },
  },
});

export const scrollArea = style({
  width: '100%',
  flexGrow: 1,
  height: 0,
});

export const collectionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px',
});

export const breadcrumb = style({
  fontSize: 14,
  lineHeight: '22px',
  color: cssVarV2.text.secondary,
  display: 'flex',
  alignItems: 'center',
});
export const breadcrumbItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  cursor: 'pointer',
  selectors: {
    '&[data-active="true"]': {
      color: cssVarV2.text.primary,
      cursor: 'default',
    },
  },
});
export const breadcrumbLink = style({
  color: 'inherit',
  textDecoration: 'none',
});
export const breadcrumbIcon = style({
  fontSize: 20,
  color: cssVarV2.icon.primary,
});
export const breadcrumbSeparator = style({
  marginLeft: 4,
  marginRight: 8,
});

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

export const newPageButtonText = style({
  fontSize: 12,
  lineHeight: '20px',
  fontWeight: 500,
});
