import { style } from '@vanilla-extract/css';

export const permissionSelector = style({
  width: '100%',
});

export const optionsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const permissionOption = style({
  display: 'flex',
  alignItems: 'flex-start',
  padding: '16px',
  border: '1px solid #e1e5e9',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    borderColor: '#1976d2',
    backgroundColor: '#f8f9fa',
  },
});

export const selected = style({
  borderColor: '#1976d2',
  backgroundColor: '#f0f7ff',
});

export const disabled = style({
  cursor: 'not-allowed',
  opacity: 0.6,
  ':hover': {
    borderColor: '#e1e5e9',
    backgroundColor: 'transparent',
  },
});

export const radioButton = style({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '2px solid #d1d5db',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
  marginTop: '2px',
  flexShrink: 0,
});

export const radioInner = style({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: 'transparent',
  transition: 'background-color 0.2s ease',
});

export const radioSelected = style({
  backgroundColor: '#1976d2',
});

export const optionContent = style({
  flex: 1,
});

export const permissionLabel = style({
  fontSize: '14px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '4px',
});

export const permissionDescription = style({
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '1.4',
});