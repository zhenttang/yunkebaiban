import { style } from '@vanilla-extract/css';

export const container = style({
  position: 'fixed',
  top: '80px',
  right: '20px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: 'var(--affine-background-primary-color)',
  border: '1px solid var(--affine-border-color)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  maxWidth: '280px',
  fontSize: '12px',
});

export const userIndicator = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const avatar = style({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'var(--affine-brand-color)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '10px',
  fontWeight: 'bold',
  flexShrink: 0,
});

export const userInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
});

export const userName = style({
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--affine-text-primary-color)',
  lineHeight: '16px',
});

export const userStatus = style({
  fontSize: '11px',
  color: 'var(--affine-text-secondary-color)',
  lineHeight: '14px',
});

export const collaborationIndicator = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  backgroundColor: 'var(--affine-background-success-color)',
  borderRadius: '4px',
  border: '1px solid var(--affine-success-color)',
});

export const collaboratorDot = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: 'var(--affine-success-color)',
  animation: 'pulse 2s infinite',
});

export const collaboratorText = style({
  fontSize: '11px',
  color: 'var(--affine-success-color)',
  fontWeight: 500,
});

export const editHint = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 8px',
  backgroundColor: 'var(--affine-background-secondary-color)',
  borderRadius: '4px',
  border: '1px dashed var(--affine-border-color)',
});

export const hintIcon = style({
  fontSize: '12px',
  flexShrink: 0,
});

export const hintText = style({
  fontSize: '11px',
  color: 'var(--affine-text-secondary-color)',
  lineHeight: '14px',
});

// 光标装饰器样式
export const cursorDecorator = style({
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: 100,
});

export const cursorLine = style({
  width: '2px',
  height: '20px',
  backgroundColor: 'var(--affine-brand-color)',
  animation: 'blink 1s infinite',
});

export const cursorLabel = style({
  position: 'absolute',
  top: '-24px',
  left: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 6px',
  backgroundColor: 'var(--affine-brand-color)',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  fontSize: '10px',
});

export const cursorLabelText = style({
  color: 'white',
  fontWeight: 500,
});

export const cursorLabelBadge = style({
  padding: '1px 4px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '2px',
  fontSize: '9px',
  color: 'white',
}); 