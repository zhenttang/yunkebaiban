import { css } from '@emotion/css';

export const personCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
  gap: '4px',
  flexWrap: 'wrap',
});

export const personItemStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px 2px 2px',
  backgroundColor: 'var(--yunke-hover-color)',
  borderRadius: '12px',
  fontSize: '13px',
  maxWidth: '150px',
});

export const personAvatarStyle = css({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: 'var(--yunke-primary-color)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: '500',
  flexShrink: 0,
});

export const personAvatarImgStyle = css({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  objectFit: 'cover',
});

export const personNameStyle = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'var(--yunke-text-primary-color)',
});

export const personRemoveButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  cursor: 'pointer',
  color: 'var(--yunke-icon-secondary)',
  marginLeft: '2px',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color-filled)',
    color: 'var(--yunke-error-color)',
  },
});

export const personAddButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '1px dashed var(--yunke-border-color)',
  cursor: 'pointer',
  color: 'var(--yunke-icon-secondary)',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color)',
    borderColor: 'var(--yunke-primary-color)',
    color: 'var(--yunke-primary-color)',
  },
});

export const personEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
});

export const personDropdownStyle = css({
  position: 'absolute',
  top: '100%',
  left: '0',
  right: '0',
  backgroundColor: 'var(--yunke-background-primary-color)',
  border: '1px solid var(--yunke-border-color)',
  borderRadius: '4px',
  boxShadow: 'var(--yunke-shadow-2)',
  maxHeight: '200px',
  overflowY: 'auto',
  zIndex: 1000,
});

export const personDropdownItemStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color)',
  },
});

export const personSearchInputStyle = css({
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '14px',
  padding: '8px 12px',
  borderBottom: '1px solid var(--yunke-border-color)',
});
