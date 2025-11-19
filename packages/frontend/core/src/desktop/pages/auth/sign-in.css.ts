import { cssVar } from '@toeverything/theme';
import { keyframes, style } from '@vanilla-extract/css';

export const fadeInUp = keyframes({
  '0%': { opacity: 0, transform: 'translateY(20px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

export const float = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-10px)' },
});

export const pulse = keyframes({
  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
  '50%': { opacity: 0.8, transform: 'scale(1.1)' },
});

export const layout = style({
  width: '100%',
  maxWidth: '1060px',
  margin: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: '56px',
  position: 'relative',
  zIndex: 2,
  animation: `${fadeInUp} 0.6s ease-out`,
  '@media': {
    'screen and (max-width: 960px)': {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px',
    },
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const panel = style({
  width: '100%',
  maxWidth: '420px',
  position: 'relative',
  overflow: 'hidden',
  // 极简风格：纯色背景，细边框
  background: cssVar('backgroundPrimaryColor'),
  borderRadius: '16px',
  padding: '40px 44px',
  boxSizing: 'border-box',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
  border: `1px solid ${cssVar('borderColor')}`,
  animation: `${fadeInUp} 0.8s ease-out 0.3s backwards`,
  selectors: {
    '[data-theme="dark"] &': {
      background: cssVar('backgroundPrimaryColor'),
      border: `1px solid ${cssVar('borderColor')}`,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    },
  },
  '@media': {
    'screen and (max-width: 960px)': {
      maxWidth: '480px',
      padding: '32px 28px',
      // A：小屏使用半透明背景，透出底部插画
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px)',
      boxShadow:
        '0 10px 24px rgba(15, 23, 42, 0.12), 0 6px 14px rgba(51, 102, 255, 0.08)',
      selectors: {
        '[data-theme="dark"] &': {
          background: 'rgba(30, 41, 59, 0.7)',
        },
      },
    },
    'screen and (max-width: 640px)': {
      width: '100%',
      padding: '28px 20px',
    },
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const hero = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '18px',
  color: cssVar('textPrimaryColor'),
  animation: `${fadeInUp} 0.8s ease-out 0.2s backwards`,
  // 增加背景模糊效果，提升文字可读性
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(12px)',
  padding: '40px',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  selectors: {
    '[data-theme="dark"] &': {
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
  '@media': {
    // 小屏时隐藏营销/宣传区域，让布局与弹窗/移动端一致
    'screen and (max-width: 960px)': {
      display: 'none',
    },
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const heroTitle = style({
  fontSize: cssVar('fontTitle'),
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: 0,
  color: cssVar('textPrimaryColor'),
});

export const heroBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  borderRadius: '9999px',
  background: cssVar('backgroundSecondaryColor'),
  color: cssVar('textPrimaryColor'),
  border: `1px solid ${cssVar('borderColor')}`,
  fontSize: cssVar('fontXs'),
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  boxShadow: 'none',
});

export const heroSubtitle = style({
  fontSize: cssVar('fontH4'),
  lineHeight: '28px',
  color: cssVar('textSecondaryColor'),
  maxWidth: '520px',
  margin: 0,
});

export const heroHighlights = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '12px',
  maxWidth: '520px',
  width: '100%',
});

export const heroHighlight = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  fontSize: cssVar('fontBase'),
  lineHeight: '26px',
  color: cssVar('textPrimaryColor'),
  '@media': {
    'screen and (max-width: 960px)': {
      justifyContent: 'flex-start',
      textAlign: 'left',
    },
  },
});

