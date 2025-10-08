import { style } from '@vanilla-extract/css';

export const wrapper = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 0,
});

export const arts = style({
  width: 'min(1200px, 90%)',
  transform: 'translateY(-12%)',
  opacity: 0.9,
  transition: 'opacity 0.3s ease',
  '@media': {
    'screen and (max-width: 960px)': {
      transform: 'translateY(-6%) scale(0.9)',
      opacity: 0.75,
    },
    'screen and (max-width: 640px)': {
      transform: 'translateY(-4%) scale(0.8)',
      opacity: 0.6,
    },
  },
});
