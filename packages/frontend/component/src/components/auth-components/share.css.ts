import { cssVar } from '@toeverything/theme';
import { globalStyle, style } from '@vanilla-extract/css';
export const authContainer = style({
  display: 'flex',
  flexDirection: 'column',
  height: 'auto',
  width: '100%',
  minHeight: '422px',
  maxHeight: '100%',
  overflow: 'auto',
});

export const authHeaderWrapper = style({
  marginBottom: '16px',
});
globalStyle(`${authHeaderWrapper} .logo`, {
  fontSize: cssVar('fontH3'),
  fontWeight: 600,
  color: cssVar('blue'),
  marginRight: '8px',
  verticalAlign: 'middle',
  filter: 'drop-shadow(0 0 4px rgba(51, 102, 255, 0.3))',
});

globalStyle(`${authHeaderWrapper} > p:first-of-type`, {
  fontSize: cssVar('fontH5'),
  fontWeight: 600,
  marginBottom: '4px',
  lineHeight: '24px',
  display: 'flex',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});
globalStyle(`[data-theme="dark"] ${authHeaderWrapper} > p:first-of-type`, {
  background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});
globalStyle(`${authHeaderWrapper} > p:last-of-type`, {
  fontSize: cssVar('fontSm'),
  fontWeight: 500,
  lineHeight: '20px',
  color: cssVar('textSecondaryColor'),
  opacity: 0.85,
});

export const authContent = style({
  fontSize: cssVar('fontBase'),
  lineHeight: cssVar('fontH3'),
  flex: '1 1 auto',
  minHeight: 0,
  '@media': {
    'screen and (max-width: 768px)': {
      flex: 'none',
    },
  },
});

globalStyle(`${authContent} > *:not(:last-child)`, {
  marginBottom: '12px',
});

export const authInputWrapper = style({
  position: 'relative',
  selectors: {
    '&.with-hint': {
      marginBottom: '8px',
    },
  },
});

export const authFooter = style({});

globalStyle(`${authFooter} > *:not(:last-child)`, {
  marginBottom: '20px',
});

globalStyle(`${authInputWrapper} label`, {
  display: 'block',
  color: cssVar('textSecondaryColor'),
  marginBottom: '4px',
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  lineHeight: '22px',
});

export const authInputError = style({
  color: cssVar('errorColor'),
  fontSize: cssVar('fontXs'),
  lineHeight: '20px',
});

globalStyle(`${authContent} a`, {
  color: cssVar('linkColor'),
});

export const authPageContainer = style({
  height: '100vh',
  width: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: cssVar('fontBase'),
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column',
      padding: '100px 20px',
      justifyContent: 'flex-start',
    },
  },
});
globalStyle(`${authPageContainer} .wrapper`, {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  justifyContent: 'center',
  overflow: 'hidden',
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
  },
});
globalStyle(`${authPageContainer} .content`, {
  maxWidth: '810px',
  '@media': {
    'screen and (min-width: 1024px)': {
      marginLeft: '200px',
      minWidth: '500px',
      marginRight: '60px',
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: 0,
    },
    'screen and (max-width: 1024px)': {
      maxWidth: '600px',
      width: '100%',
      margin: 'auto',
    },
  },
});
globalStyle(`${authPageContainer} .title`, {
  fontSize: cssVar('fontTitle'),
  fontWeight: 600,
  marginBottom: '28px',
});
globalStyle(`${authPageContainer} .subtitle`, {
  marginBottom: '28px',
});
globalStyle(`${authPageContainer} a`, {
  color: cssVar('linkColor'),
});
export const signInPageContainer = style({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  // 页面核心内容靠上，但保留更舒适的顶部留白
  justifyContent: 'flex-start',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
  padding: '72px 40px 40px',
  overflow: 'hidden',
  boxSizing: 'border-box',
  backgroundColor: cssVar('backgroundPrimaryColor'),
  transition: 'background 0.6s ease',
  selectors: {
    '[data-theme="dark"] &': {
      backgroundColor: cssVar('backgroundPrimaryColor'),
    },
  },
  '@media': {
    'screen and (max-width: 768px)': {
      minHeight: '100vh',
      justifyContent: 'flex-start',
      // 小屏也与弹窗版保持相同的顶部留白
      padding: '72px 20px 24px',
    },
    '(prefers-reduced-motion: reduce)': {
      // C：系统要求减少动态时，移除点阵叠加
      selectors: {
        '&::before': {
          opacity: 0,
          backgroundImage: 'none',
        },
      },
    },
  },
});
export const input = style({
  width: '330px',
  position: 'relative',
  '@media': {
    'screen and (max-width: 520px)': {
      width: '100%',
      maxWidth: '320px',
    },
  },
});

export const hideInSmallScreen = style({
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'none',
    },
  },
});

export const illustration = style({
  flexShrink: 0,
  width: '670px',
});
