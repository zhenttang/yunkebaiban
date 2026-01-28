import { css } from '@emotion/css';

export const attachmentCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
  gap: '4px',
  flexWrap: 'wrap',
});

export const attachmentItemStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 6px',
  backgroundColor: 'var(--yunke-hover-color)',
  borderRadius: '4px',
  fontSize: '12px',
  maxWidth: '150px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color-filled)',
  },
});

export const attachmentThumbnailStyle = css({
  width: '24px',
  height: '24px',
  borderRadius: '2px',
  objectFit: 'cover',
  flexShrink: 0,
});

export const attachmentIconStyle = css({
  width: '16px',
  height: '16px',
  flexShrink: 0,
  color: 'var(--yunke-icon-secondary)',
});

export const attachmentNameStyle = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'var(--yunke-text-primary-color)',
});

export const attachmentSizeStyle = css({
  color: 'var(--yunke-text-secondary-color)',
  fontSize: '11px',
  flexShrink: 0,
});

export const attachmentAddButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  border: '1px dashed var(--yunke-border-color)',
  cursor: 'pointer',
  color: 'var(--yunke-icon-secondary)',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color)',
    borderColor: 'var(--yunke-primary-color)',
    color: 'var(--yunke-primary-color)',
  },
});

export const attachmentEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
});

export const attachmentDeleteButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  backgroundColor: 'var(--yunke-black-30)',
  color: 'white',
  fontSize: '10px',
  cursor: 'pointer',
  marginLeft: '2px',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: 'var(--yunke-error-color)',
  },
});
