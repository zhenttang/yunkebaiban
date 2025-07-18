import { cssVar } from '@toeverything/theme';
import { keyframes, style } from '@vanilla-extract/css';

const slideDownAndFade = keyframes({
  '0%': {
    opacity: 0,
    transform: 'scale(0.9) translateY(10px)',
  },
  '100%': {
    opacity: 1,
    transform: 'scale(1) translateY(0)',
  },
});

const slideUpAndFade = keyframes({
  '0%': {
    opacity: 1,
    transform: 'scale(1) translateY(0)',
  },
  '100%': {
    opacity: 0,
    transform: 'scale(0.9) translateY(10px)',
  },
});

export const root = style({
  display: 'flex',
  alignItems: 'center',
  borderRadius: '12px',
  padding: '6px 8px',
  border: `1px solid ${cssVar('borderColor')}`,
  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)`,
  gap: 6,
  minWidth: 'max-content',
  width: 'fit-content',
  background: `linear-gradient(135deg, ${cssVar('backgroundPrimaryColor')} 0%, rgba(255, 255, 255, 0.95) 100%)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  position: 'relative',
  
  '::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '12px',
    padding: '1px',
    background: `linear-gradient(135deg, ${cssVar('borderColor')} 0%, rgba(255, 255, 255, 0.3) 100%)`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'xor',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
  },
});

export const popoverContent = style({
  willChange: 'transform opacity',
  zIndex: 1000,
  selectors: {
    '&[data-state="open"]': {
      animation: `${slideDownAndFade} 0.25s cubic-bezier(0.16, 1, 0.3, 1)`,
    },
    '&[data-state="closed"]': {
      animation: `${slideUpAndFade} 0.2s ease-in`,
    },
  },
});

export const separator = style({
  width: '1px',
  height: '20px',
  background: `linear-gradient(to bottom, transparent 0%, ${cssVar('dividerColor')} 20%, ${cssVar('dividerColor')} 80%, transparent 100%)`,
  margin: '0 2px',
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  color: cssVar('textPrimaryColor'),
  gap: 6,
  height: '36px',
  padding: '0 8px',
  fontSize: '14px',
  fontWeight: '500',
});

export const button = style([
  item,
  {
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    
    ':hover': {
      background: `linear-gradient(135deg, ${cssVar('hoverColor')} 0%, rgba(0, 0, 0, 0.02) 100%)`,
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    
    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
  },
]);

export const danger = style({
  color: cssVar('textPrimaryColor'),
  
  ':hover': {
    background: `linear-gradient(135deg, ${cssVar('backgroundErrorColor')} 0%, rgba(239, 68, 68, 0.1) 100%)`,
    color: cssVar('errorColor'),
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
  },
  
  ':active': {
    transform: 'translateY(0)',
    boxShadow: '0 1px 3px rgba(239, 68, 68, 0.2)',
  },
});

export const buttonIcon = style({
  display: 'flex',
  alignItems: 'center',
  fontSize: 18,
  color: cssVar('iconColor'),
  transition: 'all 0.15s ease',
  
  selectors: {
    [`${button}:hover &`]: {
      color: cssVar('textPrimaryColor'),
      transform: 'scale(1.1)',
    },
    [`${danger}:hover &`]: {
      color: cssVar('errorColor'),
      transform: 'scale(1.1)',
    },
  },
});
