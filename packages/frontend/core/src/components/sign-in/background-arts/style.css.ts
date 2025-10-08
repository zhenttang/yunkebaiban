import { style } from '@vanilla-extract/css';

import { float } from '../../../desktop/pages/auth/sign-in.css';

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
  opacity: 0.82,
  transition: 'opacity 0.3s ease',
  animation: `${float} 6s ease-in-out infinite`,
  '@media': {
    'screen and (max-width: 960px)': {
      transform: 'translateY(-6%) scale(0.9)',
      opacity: 0.7,
    },
    'screen and (max-width: 640px)': {
      transform: 'translateY(-4%) scale(0.8)',
      opacity: 0.55,
    },
  },
});
