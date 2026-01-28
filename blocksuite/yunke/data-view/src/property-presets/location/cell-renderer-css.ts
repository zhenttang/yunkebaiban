import { css } from '@emotion/css';

export const locationCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
  gap: '4px',
});

export const locationIconStyle = css({
  width: '16px',
  height: '16px',
  color: 'var(--yunke-icon-secondary)',
  flexShrink: 0,
});

export const locationTextStyle = css({
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
});

export const locationLinkStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--yunke-link-color)',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export const locationCoordsStyle = css({
  fontSize: '12px',
  color: 'var(--yunke-text-secondary-color)',
});

export const locationEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
});

export const locationInputContainerStyle = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const locationInputStyle = css({
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

export const locationButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid var(--yunke-border-color)',
  backgroundColor: 'transparent',
  color: 'var(--yunke-text-secondary-color)',
  cursor: 'pointer',
  fontSize: '12px',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color)',
    borderColor: 'var(--yunke-primary-color)',
  },
});
