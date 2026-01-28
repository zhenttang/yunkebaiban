import { css } from '@emotion/css';

export const relationCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  minHeight: 'var(--data-view-cell-text-line-height)',
  gap: '4px',
  flexWrap: 'wrap',
});

export const relationItemStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  backgroundColor: 'var(--yunke-hover-color)',
  borderRadius: '4px',
  fontSize: '13px',
  maxWidth: '200px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color-filled)',
  },
});

export const relationItemTextStyle = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'var(--yunke-link-color)',
});

export const relationRemoveButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  cursor: 'pointer',
  color: 'var(--yunke-icon-secondary)',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color-filled)',
    color: 'var(--yunke-error-color)',
  },
});

export const relationAddButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px 8px',
  borderRadius: '4px',
  border: '1px dashed var(--yunke-border-color)',
  cursor: 'pointer',
  color: 'var(--yunke-icon-secondary)',
  fontSize: '13px',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color)',
    borderColor: 'var(--yunke-primary-color)',
    color: 'var(--yunke-primary-color)',
  },
});

export const relationEmptyStyle = css({
  color: 'var(--yunke-placeholder-color)',
  fontSize: '14px',
});

export const relationDropdownStyle = css({
  position: 'absolute',
  top: '100%',
  left: '0',
  minWidth: '250px',
  backgroundColor: 'var(--yunke-background-primary-color)',
  border: '1px solid var(--yunke-border-color)',
  borderRadius: '4px',
  boxShadow: 'var(--yunke-shadow-2)',
  maxHeight: '250px',
  overflowY: 'auto',
  zIndex: 1000,
});

export const relationDropdownItemStyle = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--yunke-hover-color)',
  },
});

export const relationSearchInputStyle = css({
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '14px',
  padding: '8px 12px',
  borderBottom: '1px solid var(--yunke-border-color)',
});

export const relationIconStyle = css({
  width: '16px',
  height: '16px',
  marginRight: '4px',
  color: 'var(--yunke-icon-secondary)',
});
