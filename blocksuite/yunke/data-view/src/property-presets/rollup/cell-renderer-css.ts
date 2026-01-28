import { css } from '@emotion/css';

export const rollupCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
});

export const rollupValueStyle = css({
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rollupNumberStyle = css({
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
  fontVariantNumeric: 'tabular-nums',
});

export const rollupPercentStyle = css({
  fontSize: '14px',
  lineHeight: '22px',
  color: 'var(--yunke-text-primary-color)',
});

export const rollupListStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  alignItems: 'center',
});

export const rollupListItemStyle = css({
  padding: '2px 6px',
  backgroundColor: 'var(--yunke-hover-color)',
  borderRadius: '4px',
  fontSize: '12px',
  color: 'var(--yunke-text-primary-color)',
  maxWidth: '100px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rollupEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
  fontStyle: 'italic',
});

export const rollupConfigStyle = css({
  color: 'var(--yunke-text-secondary-color)',
  fontSize: '12px',
  fontStyle: 'italic',
});
