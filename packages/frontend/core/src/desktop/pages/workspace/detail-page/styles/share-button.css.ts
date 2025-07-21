import { style } from '@vanilla-extract/css';

export const shareButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: 'white',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#1976d2',
    color: '#1976d2',
  },
});

export const sharedContainer = style({
  display: 'inline-block',
});

export const sharedButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  border: '1px solid #059669',
  borderRadius: '6px',
  backgroundColor: '#ecfdf5',
  color: '#059669',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: '#d1fae5',
    borderColor: '#047857',
    color: '#047857',
  },
  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
});

export const shareIcon = style({
  fontSize: '14px',
  opacity: 0.8,
});

export const checkIcon = style({
  fontSize: '12px',
  fontWeight: 'bold',
});