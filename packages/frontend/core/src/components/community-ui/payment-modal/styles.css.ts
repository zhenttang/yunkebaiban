import { style, keyframes } from '@vanilla-extract/css';
import { communityTheme, baseButton, primaryButton, secondaryButton } from '../styles.css';
import { cssVarV2 } from '@toeverything/theme/v2';

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
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: communityTheme.spacing.lg,
  animation: `${fadeIn} 0.2s ease-out`,
});

export const modalContent = style({
  backgroundColor: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.lg,
  padding: communityTheme.spacing.xxl,
  maxWidth: '480px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  animation: `${slideUp} 0.2s ease-out`,
  boxShadow: cssVarV2('shadow/modal'),
});

export const modalHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: communityTheme.spacing.xl,
  paddingBottom: communityTheme.spacing.lg,
  borderBottom: `1px solid ${cssVarV2('layer/border')}`,
});

export const modalTitle = style({
  fontSize: communityTheme.fontSize.xl,
  fontWeight: '600',
  color: cssVarV2('text/primary'),
  margin: 0,
});

export const closeButton = style({
  background: 'none',
  border: 'none',
  fontSize: communityTheme.fontSize.xl,
  color: cssVarV2('text/secondary'),
  cursor: 'pointer',
  padding: communityTheme.spacing.sm,
  borderRadius: communityTheme.borderRadius.sm,
  transition: 'all 0.2s ease',
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
    color: cssVarV2('text/primary'),
  },
});

export const docInfo = style({
  marginBottom: communityTheme.spacing.xl,
  padding: communityTheme.spacing.lg,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: communityTheme.borderRadius.md,
});

export const docTitle = style({
  fontSize: communityTheme.fontSize.lg,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
  marginBottom: communityTheme.spacing.sm,
  lineHeight: '1.4',
});

export const docDescription = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
  lineHeight: '1.5',
  marginBottom: communityTheme.spacing.md,
});

export const priceInfo = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const priceLabel = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});

export const priceValue = style({
  fontSize: communityTheme.fontSize.xl,
  fontWeight: '600',
  color: communityTheme.colors.error,
});

export const paymentMethods = style({
  marginBottom: communityTheme.spacing.xl,
});

export const paymentMethodsTitle = style({
  fontSize: communityTheme.fontSize.md,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
  marginBottom: communityTheme.spacing.lg,
});

export const paymentMethodsList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: communityTheme.spacing.md,
});

export const paymentMethodOption = style({
  display: 'flex',
  alignItems: 'center',
  padding: communityTheme.spacing.lg,
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.md,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  ':hover': {
    borderColor: communityTheme.colors.primary,
    backgroundColor: cssVarV2('layer/background/tertiary'),
  },
  
  selectors: {
    '&[data-selected="true"]': {
      borderColor: communityTheme.colors.primary,
      backgroundColor: `${communityTheme.colors.primary}10`,
    },
  },
});

export const paymentMethodRadio = style({
  marginRight: communityTheme.spacing.md,
  cursor: 'pointer',
});

export const paymentMethodIcon = style({
  fontSize: communityTheme.fontSize.xl,
  marginRight: communityTheme.spacing.md,
});

export const paymentMethodInfo = style({
  flex: 1,
});

export const paymentMethodName = style({
  fontSize: communityTheme.fontSize.md,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
  marginBottom: '2px',
});

export const paymentMethodDesc = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});

export const qrCodeContainer = style({
  textAlign: 'center',
  padding: communityTheme.spacing.xl,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: communityTheme.borderRadius.md,
  marginBottom: communityTheme.spacing.xl,
});

export const qrCodeImage = style({
  width: '200px',
  height: '200px',
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.sm,
  marginBottom: communityTheme.spacing.md,
});

export const qrCodeText = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});

export const paymentStatus = style({
  textAlign: 'center',
  padding: communityTheme.spacing.xl,
  marginBottom: communityTheme.spacing.xl,
});

export const statusIcon = style({
  fontSize: '48px',
  marginBottom: communityTheme.spacing.md,
});

export const statusText = style({
  fontSize: communityTheme.fontSize.lg,
  fontWeight: '500',
  marginBottom: communityTheme.spacing.sm,
});

export const statusSubtext = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});

export const successStatus = style([paymentStatus, {
  color: communityTheme.colors.success,
}]);

export const errorStatus = style([paymentStatus, {
  color: communityTheme.colors.error,
}]);

export const loadingStatus = style([paymentStatus, {
  color: cssVarV2('text/secondary'),
}]);

export const modalActions = style({
  display: 'flex',
  gap: communityTheme.spacing.md,
  justifyContent: 'flex-end',
  paddingTop: communityTheme.spacing.lg,
  borderTop: `1px solid ${cssVarV2('layer/border')}`,
});

export const cancelButton = style([secondaryButton]);

export const payButton = style([primaryButton, {
  minWidth: '120px',
}]);

export const loadingDots = keyframes({
  '0%, 20%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.2)' },
  '80%, 100%': { transform: 'scale(1)' },
});

export const loadingIndicator = style({
  display: 'flex',
  gap: '4px',
  justifyContent: 'center',
  alignItems: 'center',
});

export const loadingDot = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: 'currentColor',
  animation: `${loadingDots} 1.4s ease-in-out infinite`,
  
  selectors: {
    '&:nth-child(1)': { animationDelay: '-0.32s' },
    '&:nth-child(2)': { animationDelay: '-0.16s' },
    '&:nth-child(3)': { animationDelay: '0s' },
  },
});