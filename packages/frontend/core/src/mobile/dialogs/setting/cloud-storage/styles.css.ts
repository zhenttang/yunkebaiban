import { cssVar } from '@toeverything/theme';
import { style, keyframes } from '@vanilla-extract/css';

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const cloudStorageGroup = style({
  marginBottom: 16,
});

export const storageTypeSelector = style({
  display: 'flex',
  gap: 8,
  padding: '8px 0',
});

export const storageTypeButton = style({
  flex: 1,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${cssVar('borderColor')}`,
  backgroundColor: cssVar('backgroundSecondaryColor'),
  color: cssVar('textPrimaryColor'),
  fontSize: 14,
  fontWeight: 500,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: cssVar('primaryColor'),
      borderColor: cssVar('primaryColor'),
      color: '#fff',
    },
  },
});

export const configForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '12px 0',
});

export const inputGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const inputLabel = style({
  fontSize: 12,
  color: cssVar('textSecondaryColor'),
  fontWeight: 500,
});

export const input = style({
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${cssVar('borderColor')}`,
  backgroundColor: cssVar('backgroundPrimaryColor'),
  color: cssVar('textPrimaryColor'),
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s ease',
  selectors: {
    '&:focus': {
      borderColor: cssVar('primaryColor'),
    },
    '&::placeholder': {
      color: cssVar('placeholderColor'),
    },
  },
});

export const buttonGroup = style({
  display: 'flex',
  gap: 8,
  marginTop: 8,
});

export const buttonGroupSecondary = style({
  display: 'flex',
  gap: 8,
  marginTop: 16,
});

export const button = style({
  flex: 1,
  padding: '12px 16px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

export const primaryButton = style([
  button,
  {
    backgroundColor: cssVar('primaryColor'),
    color: '#fff',
    selectors: {
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      '&:active:not(:disabled)': {
        transform: 'scale(0.98)',
      },
    },
  },
]);

export const secondaryButton = style([
  button,
  {
    backgroundColor: cssVar('backgroundSecondaryColor'),
    color: cssVar('textPrimaryColor'),
    border: `1px solid ${cssVar('borderColor')}`,
    selectors: {
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      '&:active:not(:disabled)': {
        transform: 'scale(0.98)',
      },
    },
  },
]);

export const dangerButton = style([
  button,
  {
    backgroundColor: cssVar('errorColor'),
    color: '#fff',
    selectors: {
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  },
]);

export const statusMessage = style({
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: 13,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
});

export const statusSuccess = style([
  statusMessage,
  {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    color: '#34c759',
  },
]);

export const statusError = style([
  statusMessage,
  {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    color: '#ff3b30',
  },
]);

export const statusInfo = style([
  statusMessage,
  {
    backgroundColor: cssVar('backgroundSecondaryColor'),
    color: cssVar('textSecondaryColor'),
  },
]);

export const syncSection = style({
  marginTop: 16,
  padding: '12px 0',
  borderTop: `1px solid ${cssVar('borderColor')}`,
});

export const syncTitle = style({
  fontSize: 14,
  fontWeight: 600,
  color: cssVar('textPrimaryColor'),
  marginBottom: 12,
});

export const syncButtons = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const syncButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '14px 16px',
  borderRadius: 8,
  border: `1px solid ${cssVar('borderColor')}`,
  backgroundColor: cssVar('backgroundPrimaryColor'),
  color: cssVar('textPrimaryColor'),
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    '&:active:not(:disabled)': {
      backgroundColor: cssVar('backgroundSecondaryColor'),
    },
  },
});

export const syncIcon = style({
  width: 20,
  height: 20,
});

export const loadingSpinner = style({
  animation: `${spin} 1s linear infinite`,
});

export const cloudWorkspaceList = style({
  marginTop: 12,
});

export const cloudWorkspaceItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  borderRadius: 8,
  backgroundColor: cssVar('backgroundSecondaryColor'),
  marginBottom: 8,
});

export const cloudWorkspaceInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const cloudWorkspaceName = style({
  fontSize: 14,
  fontWeight: 500,
  color: cssVar('textPrimaryColor'),
});

export const cloudWorkspaceMeta = style({
  fontSize: 12,
  color: cssVar('textSecondaryColor'),
});

export const emptyState = style({
  textAlign: 'center',
  padding: '24px 16px',
  color: cssVar('textSecondaryColor'),
  fontSize: 14,
});

export const downloadButton = style({
  padding: '6px 12px',
  flex: 'none',
});

export const refreshButton = style({
  marginTop: 12,
});

export const debugButton = style({
  marginTop: 12,
});

export const debugInfo = style({
  marginTop: 8,
  fontSize: 11,
  fontFamily: 'monospace',
});
