import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

export const authMessage = style({
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
  lineHeight: '20px',
  maxWidth: '100%',
  textAlign: 'left',
  marginTop: '12px',
  '@media': {
    'screen and (max-width: 960px)': {
      textAlign: 'center',
    },
  },
});

globalStyle(`${authMessage} a`, {
  color: cssVar('linkColor'),
});

globalStyle(`${authMessage} .link`, {
  cursor: 'pointer',
  color: cssVar('linkColor'),
});

export const captchaWrapper = style({
  margin: 'auto',
  marginBottom: '4px',
  textAlign: 'center',
});

export const passwordButtonRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '30px',
});

export const linkButton = style({
  color: cssVar('linkColor'),
  background: 'transparent',
  borderColor: 'transparent',
  fontSize: cssVar('fontXs'),
  lineHeight: '22px',
  userSelect: 'none',
});

export const addSelfhostedButton = style({
  color: cssVarV2('text/link'),
});

export const addSelfhostedButtonPrefix = style({
  color: cssVarV2('text/link'),
});

export const skipDivider = style({
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  height: 24,
  margin: '24px 0',
});

export const skipDividerLine = style({
  flex: 1,
  height: 0,
  borderBottom: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const skipDividerText = style({
  color: cssVarV2('text/secondary'),
  fontSize: cssVar('fontXs'),
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const skipText = style({
  color: cssVarV2('text/primary'),
  fontSize: cssVar('fontXs'),
  fontWeight: 500,
  textAlign: 'center',
});

export const skipLink = style({
  color: cssVarV2('text/link'),
  fontSize: cssVar('fontXs'),
  marginTop: '12px',
});

export const skipLinkIcon = style({
  color: cssVarV2('text/link'),
});

export const skipSection = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
});

export const authInput = style({
  backgroundColor: cssVarV2.button.signinbutton.background,
  border: '1px solid transparent',
  borderRadius: 16,
  transition: 'all 0.3s ease',
  selectors: {
    '&.default:focus-within': {
      boxShadow: '0 0 0 3px rgba(51, 102, 255, 0.2)',
      borderColor: cssVar('blue'),
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
    },
    '[data-theme="dark"] &.default:focus-within': {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.28)',
      borderColor: 'rgba(99, 102, 241, 0.6)',
    },
  },
});

export const signInButton = style({
  width: '100%',
  backgroundColor: cssVarV2.button.signinbutton.background,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 14px 36px rgba(51, 102, 255, 0.18)',
  selectors: {
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 18px 44px rgba(51, 102, 255, 0.24)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 12px 28px rgba(51, 102, 255, 0.22)',
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow:
        '0 0 0 3px rgba(51, 102, 255, 0.2), 0 14px 36px rgba(51, 102, 255, 0.18)',
    },
    '[data-theme="dark"] &:hover': {
      boxShadow: '0 20px 46px rgba(99, 102, 241, 0.28)',
    },
    '[data-theme="dark"] &:active': {
      boxShadow: '0 12px 28px rgba(99, 102, 241, 0.26)',
    },
  },
});
