import { style } from '@vanilla-extract/css';

export const modalBackdrop = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
});

export const modalContainer = style({
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '520px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
});

export const modalHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  borderBottom: '1px solid #e5e7eb',
});

export const modalTitle = style({
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  margin: 0,
});

export const closeButton = style({
  background: 'none',
  border: 'none',
  fontSize: '24px',
  color: '#6b7280',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  ':hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
});

export const modalContent = style({
  padding: '24px',
  overflow: 'auto',
  maxHeight: 'calc(90vh - 80px)',
});

export const formGroup = style({
  marginBottom: '20px',
});

export const label = style({
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '8px',
});

export const input = style({
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'border-color 0.2s ease',
  ':focus': {
    outline: 'none',
    borderColor: '#1976d2',
    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
  },
  '::placeholder': {
    color: '#9ca3af',
  },
});

export const textarea = style({
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease',
  ':focus': {
    outline: 'none',
    borderColor: '#1976d2',
    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
  },
  '::placeholder': {
    color: '#9ca3af',
  },
});

export const buttonGroup = style({
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
});

export const cancelButton = style({
  padding: '10px 20px',
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
    borderColor: '#9ca3af',
  },
  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
});

export const shareButton = style({
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#1976d2',
  color: 'white',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: '#1565c0',
  },
  ':disabled': {
    cursor: 'not-allowed',
    backgroundColor: '#9ca3af',
  },
});