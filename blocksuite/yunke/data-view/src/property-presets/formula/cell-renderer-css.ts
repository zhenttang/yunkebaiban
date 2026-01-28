import { css } from '@emotion/css';

export const formulaCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
});

export const formulaValueStyle = css({
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const formulaEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
  fontStyle: 'italic',
});

export const formulaErrorStyle = css({
  color: 'var(--yunke-error-color)',
  fontSize: '12px',
});

export const formulaEditContainerStyle = css({
  width: '100%',
});

export const formulaInputStyle = css({
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
  fontFamily: 'monospace',
  '&::placeholder': {
    color: 'var(--yunke-placeholder-color)',
  },
});

export const formulaPreviewStyle = css({
  fontSize: '12px',
  color: 'var(--yunke-text-secondary-color)',
  marginTop: '4px',
});
