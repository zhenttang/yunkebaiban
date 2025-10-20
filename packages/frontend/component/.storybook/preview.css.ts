import { globalStyle } from '@vanilla-extract/css';

globalStyle('*', {
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  color: 'var(--yunke-text-primary-color)',
  fontFamily: 'var(--yunke-font-family)',
  fontSize: 'var(--yunke-font-base)',
  lineHeight: 'var(--yunke-font-height)',
  backgroundColor: 'var(--yunke-background-primary-color)',
});

globalStyle('.docs-story', {
  backgroundColor: 'var(--yunke-background-primary-color)',
});

globalStyle('body.sb-main-fullscreen', {
  overflowY: 'auto',
});
