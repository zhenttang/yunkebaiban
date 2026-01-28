import { css } from '@emotion/css';

export const ratingCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
  userSelect: 'none',
});

export const ratingContainerStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  height: 'var(--data-view-cell-text-line-height)',
});

export const ratingStarStyle = css({
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: '1',
  transition: 'transform 0.1s ease-in-out',
  '&:hover': {
    transform: 'scale(1.2)',
  },
});

export const ratingStarReadonlyStyle = css({
  cursor: 'default',
  fontSize: '16px',
  lineHeight: '1',
  '&:hover': {
    transform: 'none',
  },
});

export const ratingEmptyStyle = css({
  color: 'var(--yunke-black-30)',
});

export const ratingFilledStyle = css({
  // Color will be set inline
});

export const ratingHalfStyle = css({
  position: 'relative',
  display: 'inline-block',
});

export const ratingHalfInnerStyle = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '50%',
  overflow: 'hidden',
});
