import { style } from '@vanilla-extract/css';

export const quickMenuPanel = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '480px',
  maxHeight: '600px',
  backgroundColor: 'var(--yunke-background-overlay-panel-color)',
  borderRadius: '12px',
  boxShadow: 'var(--yunke-shadow-2)',
  padding: '12px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  overflow: 'hidden',
});

export const quickMenuHeader = style({
  padding: '8px 12px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--yunke-text-primary-color)',
  borderBottom: '1px solid var(--yunke-border-color)',
  marginBottom: '8px',
});

export const quickMenuContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  overflowY: 'auto',
  maxHeight: '500px',
});

export const quickMenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: 'var(--yunke-hover-color)',
  },
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: 'var(--yunke-hover-color)',
    },
  },
});

export const quickMenuItemIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  color: 'var(--yunke-icon-color)',
});

export const quickMenuItemContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
});

export const quickMenuItemTitle = style({
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--yunke-text-primary-color)',
});

export const quickMenuItemDescription = style({
  fontSize: '12px',
  color: 'var(--yunke-text-secondary-color)',
});

export const quickMenuOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 999,
});
