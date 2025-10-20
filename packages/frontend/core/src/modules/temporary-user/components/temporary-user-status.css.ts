import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  border: '1px solid var(--yunke-border-color)',
  borderRadius: '8px',
  backgroundColor: 'var(--yunke-background-primary-color)',
  position: 'relative',
});

export const compactContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  border: '1px solid var(--yunke-border-color)',
  borderRadius: '6px',
  backgroundColor: 'var(--yunke-background-primary-color)',
  minHeight: '40px',
});

export const userInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

export const avatar = style({
  flexShrink: 0,
});

export const details = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
});

export const userName = style({
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--yunke-text-primary-color)',
  lineHeight: '22px',
});

export const status = style({
  fontSize: '12px',
  lineHeight: '20px',
});

export const success = style({
  color: 'var(--yunke-success-color)',
});

export const warning = style({
  color: 'var(--yunke-warning-color)',
});

export const error = style({
  color: 'var(--yunke-error-color)',
});

export const timeInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
});

export const timeLabel = style({
  color: 'var(--yunke-text-secondary-color)',
});

export const timeValue = style({
  fontWeight: 500,
});

export const timeRemaining = style({
  fontSize: '11px',
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor: 'var(--yunke-background-secondary-color)',
  fontWeight: 500,
});

export const compactName = style({
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--yunke-text-primary-color)',
  maxWidth: '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'flex-end',
});

export const loadingOverlay = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  zIndex: 1,
}); 