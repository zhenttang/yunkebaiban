import { css } from '@emotion/css';

export const urlCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
});

export const urlLinkStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'var(--yunke-link-color)',
  textDecoration: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: '22px',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export const urlIconStyle = css({
  flexShrink: 0,
  width: '14px',
  height: '14px',
  color: 'var(--yunke-icon-secondary)',
});

export const urlTextStyle = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const urlInputStyle = css({
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
  '&::placeholder': {
    color: 'var(--yunke-placeholder-color)',
  },
});

export const urlEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
});
