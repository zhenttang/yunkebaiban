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
  backgroundColor: cssVar('backgroundPrimaryColor'),
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: 8,
  transition: 'all 0.2s ease',
  selectors: {
    '&.default:focus-within': {
      borderColor: cssVar('textPrimaryColor'),
      backgroundColor: cssVar('backgroundPrimaryColor'),
    },
    '[data-theme="dark"] &.default:focus-within': {
      borderColor: cssVar('textPrimaryColor'),
      backgroundColor: cssVar('backgroundPrimaryColor'),
    },
  },
});

export const signInButton = style({
  width: '100%',
  backgroundColor: cssVar('textPrimaryColor'),
  color: cssVar('backgroundPrimaryColor'),
  borderRadius: 8,
  transition: 'all 0.2s ease',
  boxShadow: 'none',
  selectors: {
    '&:hover': {
      opacity: 0.9,
    },
    '&:active': {
      opacity: 0.8,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${cssVar('backgroundPrimaryColor')}, 0 0 0 4px ${cssVar('textPrimaryColor')}`,
    },
  },
});

export const oauthWrapper = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px',
  marginTop: '32px',
  marginBottom: '32px',
});

export const oauthButton = style({
  width: '100%',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.5)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  color: cssVar('textSecondaryColor'),
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.8)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 'none',
    },
    '[data-theme="dark"] &': {
      background: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '[data-theme="dark"] &:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
});

export const oauthIcon = style({
  width: '20px',
  height: '20px',
  color: cssVar('textSecondaryColor'),
  filter: 'drop-shadow(0 0 2px rgba(51, 102, 255, 0.2))',
  transition: 'all 0.3s ease',
});
