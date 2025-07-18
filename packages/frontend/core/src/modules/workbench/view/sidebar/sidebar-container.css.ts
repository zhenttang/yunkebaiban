import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const sidebarContainerInner = style({
  display: 'flex',
  background: `linear-gradient(135deg, ${cssVar('backgroundPrimaryColor')} 0%, rgba(255, 255, 255, 0.98) 100%)`,
  flexDirection: 'column',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  borderRadius: 'inherit',
  position: 'relative',
  
  // 添加微妙的内阴影
  '::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${cssVarV2.layer.insideBorder.border} 20%, ${cssVarV2.layer.insideBorder.border} 80%, transparent 100%)`,
    opacity: 0.6,
  },
  
  selectors: {
    ['[data-client-border=true] &']: {
      borderRadius: 8,
      border: `1px solid ${cssVarV2.layer.insideBorder.border}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    },
    ['[data-client-border=true][data-is-floating="true"] &']: {
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
      border: `1px solid ${cssVarV2.layer.insideBorder.border}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
  },
});

export const sidebarBodyTarget = style({
  display: 'flex',
  flexDirection: 'column',
  height: 0,
  flex: 1,
  width: '100%',
  alignItems: 'stretch',
  padding: '8px 12px',
  gap: '6px',
});

export const borderTop = style({
  borderTop: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  position: 'relative',
  
  '::before': {
    content: '""',
    position: 'absolute',
    top: '-1px',
    left: '12px',
    right: '12px',
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${cssVarV2.layer.insideBorder.border} 20%, ${cssVarV2.layer.insideBorder.border} 80%, transparent 100%)`,
  },
});

export const sidebarBodyNoSelection = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  justifyContent: 'center',
  userSelect: 'none',
  color: cssVar('--affine-text-secondary-color'),
  alignItems: 'center',
  fontSize: '14px',
  fontWeight: '500',
  opacity: 0.7,
  
  // 添加一个微妙的图标或装饰
  '::before': {
    content: '"📋"',
    fontSize: '24px',
    marginBottom: '8px',
    opacity: 0.5,
  },
});
