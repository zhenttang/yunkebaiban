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
  margin: '0 auto',
  display: 'flex',
  alignItems: 'stretch',
  gap: '56px',
  position: 'relative',
  zIndex: 2,
  animation: `${fadeInUp} 0.6s ease-out`,
  '@media': {
    'screen and (max-width: 960px)': {
      flexDirection: 'column-reverse',
      alignItems: 'center',
      gap: '32px',
    },
  },
});

export const panel = style({
  width: '100%',
  maxWidth: '420px',
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.68)) padding-box, linear-gradient(135deg, rgba(51, 102, 255, 0.35), rgba(139, 92, 246, 0.35)) border-box',
  borderRadius: '28px',
  padding: '40px 44px',
  boxSizing: 'border-box',
  boxShadow:
    '0 30px 80px rgba(15, 23, 42, 0.18), 0 12px 32px rgba(51, 102, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.32)',
  border: '1px solid transparent',
  backgroundClip: ['padding-box', 'border-box'],
  backdropFilter: 'blur(24px)',
  animation: `${fadeInUp} 0.8s ease-out 0.3s backwards`,
  selectors: {
    '[data-theme="dark"] &': {
      background:
        'linear-gradient(135deg, rgba(17, 24, 39, 0.88), rgba(15, 23, 42, 0.72)) padding-box, linear-gradient(135deg, rgba(79, 70, 229, 0.45), rgba(16, 185, 129, 0.28)) border-box',
      backgroundClip: ['padding-box', 'border-box'],
      boxShadow:
        '0 30px 80px rgba(2, 6, 23, 0.7), 0 12px 32px rgba(79, 70, 229, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    },
  },
  '@media': {
    'screen and (max-width: 960px)': {
      maxWidth: '480px',
      padding: '32px 28px',
    },
    'screen and (max-width: 640px)': {
      width: '100%',
      padding: '28px 20px',
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
  '@media': {
    'screen and (max-width: 960px)': {
      alignItems: 'center',
      textAlign: 'center',
      maxWidth: '560px',
    },
  },
});

export const heroTitle = style({
  fontSize: cssVar('fontTitle'),
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: 0,
  background: 'linear-gradient(135deg, #3366ff 0%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const heroBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  borderRadius: '9999px',
  background: 'linear-gradient(135deg, rgba(51, 102, 255, 0.2), rgba(139, 92, 246, 0.3))',
  color: cssVar('blue'),
  fontSize: cssVar('fontXs'),
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  boxShadow: '0 10px 30px rgba(51, 102, 255, 0.25)',
  selectors: {
    '[data-theme="dark"] &': {
      background:
        'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(30, 64, 175, 0.28))',
      boxShadow: '0 12px 32px rgba(79, 70, 229, 0.35)',
    },
  },
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

export const heroDot = style({
  flexShrink: 0,
  width: '10px',
  height: '10px',
  borderRadius: '9999px',
  background: cssVar('blue'),
  boxShadow: '0 0 0 4px rgba(51, 102, 255, 0.18)',
  marginTop: '7px',
  animation: `${pulse} 2s ease-in-out infinite`,
  selectors: {
    '[data-theme="dark"] &': {
      boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.25)',
    },
  },
});
