import { cssVarV2 } from '@toeverything/theme/v2';
import { keyframes, style } from '@vanilla-extract/css';

export const container = style({
  position: 'relative',
  borderRadius: 24,
  padding: '36px 32px 40px',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  overflow: 'hidden',
});

export const gridBackground = style({
  position: 'absolute',
  inset: 0,
  opacity: 0.06,
  backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  pointerEvents: 'none',
});

export const content = style({
  position: 'relative',
  zIndex: 1,
  maxWidth: 480,
});

export const title = style({
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  marginBottom: 8,
  color: cssVarV2('text/primary'),
});

export const description = style({
  fontSize: 14,
  lineHeight: '22px',
  color: cssVarV2('text/secondary'),
});

export const illustration = style({
  position: 'relative',
  width: 256,
  height: 256,
  marginBottom: 24,
});

const pulse = keyframes({
  '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.9 },
  '50%': { transform: 'translate(-50%, -50%) scale(1.04)', opacity: 1 },
  '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.9 },
});

export const centerCircle = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 160,
  height: 160,
  borderRadius: '50%',
  background:
    'linear-gradient(135deg, #e0e7ff 0%, #ffffff 35%, #f5f3ff 100%)',
  boxShadow: '0 22px 48px -16px rgba(79, 70, 229, 0.35)',
  transform: 'translate(-50%, -50%)',
  animation: `${pulse} 4s ease-in-out infinite`,
});

export const cardLeft = style({
  position: 'absolute',
  top: 52,
  left: 52,
  width: 104,
  height: 136,
  borderRadius: 14,
  background: 'rgba(255, 255, 255, 0.92)',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  transform: 'rotate(-12deg)',
  padding: 12,
  boxSizing: 'border-box',
});

export const cardRight = style({
  position: 'absolute',
  top: 36,
  right: 40,
  width: 118,
  height: 148,
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.96)',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  transform: 'rotate(6deg)',
  padding: 16,
  boxSizing: 'border-box',
});

export const particle = style({
  position: 'absolute',
  borderRadius: '999px',
});

