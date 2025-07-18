import { style, keyframes } from '@vanilla-extract/css';

export const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' }
});

export const inlineCloudStatus = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',
  
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  ':active': {
    transform: 'scale(0.98)',
  }
});

export const statusIcon = style({
  fontSize: '12px',
  lineHeight: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const statusText = style({
  fontSize: '11px',
  lineHeight: '1',
  whiteSpace: 'nowrap',
});

export const pendingBadge = style({
  backgroundColor: 'rgba(245, 158, 11, 0.9)',
  color: 'white',
  borderRadius: '8px',
  padding: '1px 4px',
  fontSize: '9px',
  minWidth: '12px',
  textAlign: 'center',
  fontWeight: '600',
  lineHeight: '1.2',
});

export const lastSyncText = style({
  color: 'rgba(107, 114, 128, 0.8)',
  fontSize: '9px',
  lineHeight: '1',
  whiteSpace: 'nowrap',
});