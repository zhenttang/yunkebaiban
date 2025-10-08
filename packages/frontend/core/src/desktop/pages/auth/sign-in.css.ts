import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const layout = style({
  width: '100%',
  maxWidth: '1060px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'stretch',
  gap: '56px',
  position: 'relative',
  zIndex: 2,
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
  backgroundColor: cssVar('backgroundPrimaryColor'),
  borderRadius: '28px',
  padding: '40px 44px',
  boxSizing: 'border-box',
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.1)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(14px)',
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
});

export const heroBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  borderRadius: '9999px',
  background: 'rgba(51, 102, 255, 0.14)',
  color: cssVar('blue'),
  fontSize: cssVar('fontXs'),
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
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
  boxShadow: '0 0 0 4px rgba(51, 102, 255, 0.15)',
  marginTop: '7px',
});
