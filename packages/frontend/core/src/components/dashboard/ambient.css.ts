import { style, keyframes } from '@vanilla-extract/css';

const float = keyframes({
  '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.8 },
  '50%': { transform: 'translate(50px, -30px) scale(1.06)', opacity: 1 },
  '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.8 },
});

const baseGlow = style({
  position: 'absolute',
  width: 520,
  height: 520,
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 0,
  animation: `${float} 12s ease-in-out infinite`,
});

export const primaryGlow = style([
  baseGlow,
  {
    top: -120,
    left: -140,
    background:
      'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(129, 140, 248, 0.04) 40%, rgba(15, 23, 42, 0) 70%)',
  },
]);

export const secondaryGlow = style([
  baseGlow,
  {
    bottom: -200,
    right: -120,
    background:
      'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(147, 197, 253, 0.05) 40%, rgba(15, 23, 42, 0) 70%)',
    animationDelay: '-6s',
  },
]);

