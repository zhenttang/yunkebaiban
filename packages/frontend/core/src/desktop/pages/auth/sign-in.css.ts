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
  maxWidth: '1200px', // Increased max-width
  margin: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center', // Center content
  gap: '80px', // Increased gap
  position: 'relative',
  zIndex: 2,
  padding: '0 20px', // Add horizontal padding
  animation: `${fadeInUp} 0.6s ease-out`,
  '@media': {
    'screen and (max-width: 960px)': {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px',
    },
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const panel = style({
  width: '100%',
  maxWidth: '480px', // Slightly wider panel
  position: 'relative',
  overflow: 'hidden',
  // Glassmorphism effect
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  borderRadius: '24px', // Increased border radius
  padding: '48px', // Increased padding
  boxSizing: 'border-box',
  // Softer, multi-layered shadow
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  animation: `${fadeInUp} 0.8s ease-out 0.3s backwards`,
  selectors: {
    '[data-theme="dark"] &': {
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    },
  },
  '@media': {
    'screen and (max-width: 960px)': {
      maxWidth: '100%',
      padding: '32px 24px',
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

