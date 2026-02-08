import { style } from '@vanilla-extract/css';

/**
 * Session Overlay 样式（调试用，显示实时协作者）
 */

export const overlayContainer = style({
  position: 'fixed',
  right: 16,
  bottom: 72,
  zIndex: 9999,
  background: 'rgba(17, 24, 39, 0.86)',
  color: '#fff',
  padding: '12px 16px',
  borderRadius: 12,
  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.35)',
  pointerEvents: 'none',
  maxWidth: 280,
  fontSize: 12,
  lineHeight: 1.5,
});

export const overlayTitle = style({
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 6,
  letterSpacing: '0.02em',
});

export const sessionItem = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '4px 0',
});

export const sessionItemLocal = style([sessionItem, {
  opacity: 0.78,
}]);

export const sessionLabel = style({
  fontWeight: 600,
});

export const sessionLabelLocal = style({
  fontWeight: 500,
});

export const sessionId = style({
  fontFamily: 'SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  opacity: 0.65,
});
