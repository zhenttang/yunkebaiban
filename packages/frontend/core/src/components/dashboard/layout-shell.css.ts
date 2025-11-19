import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
});

export const sidebar = style({
  width: 280,
  minWidth: 280,
  maxWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 10,
});

export const main = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  zIndex: 1,
  backgroundColor: '#f8fafc',
});

export const mainInner = style({
  maxWidth: 1120,
  margin: '0 auto',
  padding: '24px 32px 40px',
  height: '100%',
  boxSizing: 'border-box',
  overflow: 'auto',
});

