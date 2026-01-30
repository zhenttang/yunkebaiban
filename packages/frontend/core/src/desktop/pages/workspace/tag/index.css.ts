import { style } from '@vanilla-extract/css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  width: '100%',
  containerName: 'tag-body',
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
    'tag-body (width <= 1024px)': {
      padding: '0 32px 40px 32px',
    },
    'tag-body (width <= 768px)': {
      padding: '0 24px 32px 24px',
    },
    'tag-body (width <= 480px)': {
      padding: '0 16px 24px 16px',
    },
  },
});

export const scrollArea = style({
  height: 0,
  flexGrow: 1,
});
