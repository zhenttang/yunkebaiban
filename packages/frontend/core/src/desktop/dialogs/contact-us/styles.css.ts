import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const modalContent = style({
  padding: '24px',
});

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const description = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.5',
  textAlign: 'center',
});

export const contactMethods = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const contactButton = style({
  justifyContent: 'flex-start',
  padding: '12px 16px',
  height: 'auto',
  fontWeight: 'normal',
  borderRadius: '8px',
  
  selectors: {
    '&:hover': {
      backgroundColor: cssVar('hoverColor'),
    },
  },
});

export const footer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  alignItems: 'center',
  paddingTop: '16px',
  borderTop: `1px solid ${cssVar('borderColor')}`,
});

export const workingHours = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
});

export const response = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
}); 