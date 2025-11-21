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
  maxWidth: '1200px',
  margin: '0 auto',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '120px',
  position: 'relative',
  zIndex: 2,
  padding: '0 60px',
  animation: `${fadeInUp} 0.6s ease-out`,
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '60px',
      padding: '40px 24px',
    },
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const panel = style({
  width: '100%',
  maxWidth: '440px',
  position: 'relative',
  overflow: 'hidden',
  // Enhanced Glassmorphism
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(24px) saturate(180%)',
  borderRadius: '32px',
  padding: '48px',
  boxSizing: 'border-box',
  boxShadow: `
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 10px 15px -3px rgba(0, 0, 0, 0.04),
    0 40px 80px -12px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.6)
  `,
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards`,
  selectors: {
    '[data-theme="dark"] &': {
      background: 'rgba(20, 20, 25, 0.7)',
      boxShadow: `
        0 4px 6px -1px rgba(0, 0, 0, 0.2),
        0 20px 40px -8px rgba(0, 0, 0, 0.4),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08)
      `,
    },
  },
  '@media': {
    'screen and (max-width: 480px)': {
      padding: '32px 24px',
      borderRadius: '24px',
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
  gap: '24px', // Increased gap
  color: cssVar('textPrimaryColor'),
  animation: `${fadeInUp} 0.8s ease-out 0.2s backwards`,
  // Removed background for cleaner look, text stands on its own or with subtle backing
  padding: '20px',
  '@media': {
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

