import { style, keyframes } from '@vanilla-extract/css';
import { cssVar } from '@toeverything/theme';

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const slideUp = keyframes({
  '0%': { 
    opacity: 0,
    transform: 'translateY(20px) scale(0.95)',
  },
  '100%': { 
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});

export const modalOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  animation: `${fadeIn} 0.2s ease-out`,
});

export const modalContent = style({
  backgroundColor: cssVar('backgroundPrimaryColor'),
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '12px',
  padding: 0,
  maxWidth: '520px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  animation: `${slideUp} 0.2s ease-out`,
  boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`,
});

export const modalHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: `1px solid ${cssVar('borderColor')}`,
  background: cssVar('backgroundOverlayPanelColor'),
  borderTopLeftRadius: '12px',
  borderTopRightRadius: '12px',
});

export const modalTitle = style({
  fontSize: cssVar('fontH6'),
  fontWeight: '600',
  color: cssVar('textPrimaryColor'),
  margin: 0,
  lineHeight: '1.5',
});

export const closeButton = style({
  background: 'none',
  border: 'none',
  fontSize: '20px',
  color: cssVar('iconSecondary'),
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  
  ':hover': {
    backgroundColor: cssVar('hoverColor'),
    color: cssVar('textPrimaryColor'),
  },
});

export const modalBody = style({
  padding: '24px',
});

export const docInfo = style({
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: cssVar('backgroundTertiaryColor'),
  borderRadius: '8px',
  border: `1px solid ${cssVar('borderColor')}`,
});

export const docTitle = style({
  fontSize: cssVar('fontBase'),
  fontWeight: '600',
  color: cssVar('textPrimaryColor'),
  marginBottom: '8px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
});

export const docDescription = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.5',
  marginBottom: '12px',
  margin: '0 0 12px 0',
});

export const priceInfo = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const priceLabel = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
});

export const priceValue = style({
  fontSize: cssVar('fontH5'),
  fontWeight: '600',
  color: cssVar('brandColor'),
});

export const paymentMethods = style({
  marginBottom: '24px',
});

export const paymentMethodsTitle = style({
  fontSize: cssVar('fontSm'),
  fontWeight: '600',
  color: cssVar('textPrimaryColor'),
  marginBottom: '12px',
  margin: '0 0 12px 0',
});

export const paymentMethodsList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const paymentMethodOption = style({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: cssVar('backgroundPrimaryColor'),
  
  ':hover': {
    borderColor: cssVar('brandColor'),
    backgroundColor: cssVar('backgroundTertiaryColor'),
  },
  
  selectors: {
    '&[data-selected="true"]': {
      borderColor: cssVar('brandColor'),
      backgroundColor: cssVar('backgroundTertiaryColor'),
      boxShadow: `0 0 0 1px ${cssVar('brandColor')}`,
    },
  },
});

export const paymentMethodRadio = style({
  marginRight: '12px',
  cursor: 'pointer',
  accentColor: cssVar('brandColor'),
});

export const paymentMethodIcon = style({
  fontSize: '20px',
  marginRight: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
});

export const paymentMethodInfo = style({
  flex: 1,
});

export const paymentMethodName = style({
  fontSize: cssVar('fontSm'),
  fontWeight: '500',
  color: cssVar('textPrimaryColor'),
  marginBottom: '2px',
  lineHeight: '1.4',
});

export const paymentMethodDesc = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.4',
});

export const qrCodeContainer = style({
  textAlign: 'center',
  padding: '24px',
  backgroundColor: cssVar('backgroundTertiaryColor'),
  borderRadius: '8px',
  marginBottom: '24px',
  border: `1px solid ${cssVar('borderColor')}`,
});

export const qrCodeImage = style({
  width: '200px',
  height: '200px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '8px',
  marginBottom: '12px',
  backgroundColor: '#fff',
});

export const qrCodeText = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.5',
});

export const paymentStatus = style({
  textAlign: 'center',
  padding: '32px 24px',
  marginBottom: '24px',
});

export const statusIcon = style({
  fontSize: '48px',
  marginBottom: '12px',
  display: 'block',
});

export const statusText = style({
  fontSize: cssVar('fontBase'),
  fontWeight: '600',
  marginBottom: '8px',
  color: cssVar('textPrimaryColor'),
  lineHeight: '1.5',
});

export const statusSubtext = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.5',
});

export const successStatus = style([paymentStatus, {
  selectors: {
    [`& ${statusIcon}`]: {
      color: cssVar('successColor'),
    },
  },
}]);

export const errorStatus = style([paymentStatus, {
  selectors: {
    [`& ${statusIcon}`]: {
      color: cssVar('errorColor'),
    },
  },
}]);

export const loadingStatus = style([paymentStatus, {
  selectors: {
    [`& ${statusIcon}`]: {
      color: cssVar('textSecondaryColor'),
    },
  },
}]);

export const modalActions = style({
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  padding: '16px 24px',
  borderTop: `1px solid ${cssVar('borderColor')}`,
  backgroundColor: cssVar('backgroundOverlayPanelColor'),
  borderBottomLeftRadius: '12px',
  borderBottomRightRadius: '12px',
});

export const cancelButton = style({
  padding: '8px 16px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '6px',
  backgroundColor: cssVar('backgroundPrimaryColor'),
  color: cssVar('textPrimaryColor'),
  fontSize: cssVar('fontSm'),
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '80px',
  
  ':hover': {
    backgroundColor: cssVar('hoverColor'),
    borderColor: cssVar('hoverColorFilled'),
  },

  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const payButton = style({
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: cssVar('brandColor'),
  color: '#fff',
  fontSize: cssVar('fontSm'),
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '120px',
  
  ':hover': {
    backgroundColor: cssVar('primaryColor'),
  },

  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const loadingDots = keyframes({
  '0%, 20%': { transform: 'scale(1)', opacity: 1 },
  '50%': { transform: 'scale(1.2)', opacity: 0.7 },
  '80%, 100%': { transform: 'scale(1)', opacity: 1 },
});

export const loadingIndicator = style({
  display: 'flex',
  gap: '4px',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '16px 0',
});

export const loadingDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: cssVar('brandColor'),
  animation: `${loadingDots} 1.4s ease-in-out infinite both`,
  
  selectors: {
    '&:nth-child(1)': { animationDelay: '-0.32s' },
    '&:nth-child(2)': { animationDelay: '-0.16s' },
    '&:nth-child(3)': { animationDelay: '0s' },
  },
});