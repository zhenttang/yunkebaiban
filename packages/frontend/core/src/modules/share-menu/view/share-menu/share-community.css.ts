import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const container = style({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const loadingText = style({
  color: cssVar('textSecondaryColor'),
  fontSize: '14px',
  textAlign: 'center',
  padding: '20px 0',
});

export const statusCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
  backgroundColor: cssVar('backgroundSuccessColor'),
  borderRadius: '8px',
  border: `1px solid ${cssVar('borderColor')}`,
});

export const statusIcon = style({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#059669',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: 'bold',
});

export const statusText = style({
  flex: 1,
});

export const statusTitle = style({
  fontSize: '14px',
  fontWeight: 600,
  color: cssVar('textPrimaryColor'),
  marginBottom: '4px',
});

export const statusDesc = style({
  fontSize: '12px',
  color: cssVar('textSecondaryColor'),
});

export const unshareButton = style({
  alignSelf: 'flex-start',
});

export const infoCard = style({
  padding: '16px',
  backgroundColor: cssVar('backgroundSecondaryColor'),
  borderRadius: '8px',
  border: `1px solid ${cssVar('borderColor')}`,
});

export const infoTitle = style({
  fontSize: '14px',
  fontWeight: 600,
  color: cssVar('textPrimaryColor'),
  marginBottom: '8px',
});

export const infoDesc = style({
  fontSize: '13px',
  color: cssVar('textSecondaryColor'),
  lineHeight: 1.5,
});

export const shareButton = style({
  alignSelf: 'flex-start',
});

export const formTitle = style({
  fontSize: '16px',
  fontWeight: 600,
  color: cssVar('textPrimaryColor'),
  marginBottom: '4px',
});

export const formGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const label = style({
  fontSize: '13px',
  fontWeight: 500,
  color: cssVar('textSecondaryColor'),
});

export const input = style({
  padding: '8px 12px',
  fontSize: '14px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '6px',
  backgroundColor: cssVar('backgroundPrimaryColor'),
  color: cssVar('textPrimaryColor'),
  outline: 'none',
  transition: 'border-color 0.2s',
  ':focus': {
    borderColor: cssVar('primaryColor'),
  },
  '::placeholder': {
    color: cssVar('placeholderColor'),
  },
});

export const textarea = style({
  padding: '8px 12px',
  fontSize: '14px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '6px',
  backgroundColor: cssVar('backgroundPrimaryColor'),
  color: cssVar('textPrimaryColor'),
  outline: 'none',
  resize: 'vertical',
  minHeight: '60px',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
  ':focus': {
    borderColor: cssVar('primaryColor'),
  },
  '::placeholder': {
    color: cssVar('placeholderColor'),
  },
});

export const buttonGroup = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
});
