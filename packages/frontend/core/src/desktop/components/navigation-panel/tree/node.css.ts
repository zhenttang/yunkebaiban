import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { createVar, keyframes, style } from '@vanilla-extract/css';
export const levelIndent = createVar();
export const linkItemRoot = style({
  color: 'inherit',
});
export const itemRoot = style({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '8px',
  textAlign: 'left',
  color: 'inherit',
  width: '100%',
  minHeight: '36px',
  userSelect: 'none',
  cursor: 'pointer',
  padding: '8px 12px',
  fontSize: cssVar('fontSm'),
  fontWeight: '500',
  position: 'relative',
  marginTop: '2px',
  marginBottom: '2px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  selectors: {
    '&:hover': {
      background: cssVar('hoverColor'),
      transform: 'translateX(2px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    '&[data-active="true"]': {
      background: cssVar('hoverColor'),
      fontWeight: '600',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      transform: 'translateX(1px)',
    },
    '&[data-active="true"]:hover': {
      transform: 'translateX(3px)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    },
    '&:active': {
      transform: 'translateX(1px) scale(0.98)',
      transition: 'all 0.1s ease-out',
    },
    '&[data-disabled="true"]': {
      cursor: 'default',
      color: cssVar('textSecondaryColor'),
      pointerEvents: 'none',
      opacity: 0.6,
    },
    '&[data-dragging="true"]': {
      opacity: 0.5,
      transform: 'rotate(1deg) scale(0.95)',
    },
  },
});
export const itemMain = style({
  display: 'flex',
  alignItems: 'center',
  width: 0,
  flex: 1,
  position: 'relative',
  gap: 12,
  minHeight: '20px',
});
export const itemRenameAnchor = style({
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  top: -10,
  width: 10,
  height: 10,
});
export const itemContent = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  alignItems: 'center',
  flex: 1,
  color: cssVarV2('text/primary'),
  lineHeight: cssVar('lineHeight'),
  fontWeight: '500',
  fontSize: cssVar('fontSm'),
});
export const postfix = style({
  display: 'flex',
  alignItems: 'center',
  right: 0,
  position: 'absolute',
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.2s ease-in-out',
  selectors: {
    [`${itemRoot}:hover &`]: {
      opacity: 1,
      pointerEvents: 'initial',
      position: 'initial',
    },
  },
});
export const iconContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 24,
  height: 24,
  minWidth: 24,
  color: cssVarV2('icon/primary'),
  fontSize: 20,
});
export const collapsedIconContainer = style({
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  color: cssVarV2('icon/primary'),
  selectors: {
    '&[data-collapsed="true"]': {
      transform: 'rotate(-90deg) scale(0.9)',
    },
    '&[data-disabled="true"]': {
      opacity: 0.3,
      pointerEvents: 'none',
    },
    '&:hover': {
      background: cssVar('hoverColor'),
      transform: 'scale(1.1)',
    },
    '&:hover[data-collapsed="true"]': {
      transform: 'rotate(-90deg) scale(1.0)',
    },
  },
});
export const collapsedIcon = style({
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  selectors: {
    '&[data-collapsed="true"]': {
      transform: 'rotate(-90deg) scale(0.9)',
    },
  },
});

export const collapseContentPlaceholder = style({
  display: 'none',
  selectors: {
    '&:only-child': {
      display: 'initial',
    },
  },
});

const draggedOverAnimation = keyframes({
  '0%': {
    opacity: 1,
    transform: 'scale(1)',
  },
  '25%': {
    opacity: 0.8,
    transform: 'scale(1.02)',
  },
  '50%': {
    opacity: 0.6,
    transform: 'scale(0.98)',
  },
  '75%': {
    opacity: 0.8,
    transform: 'scale(1.02)',
  },
  '100%': {
    opacity: 1,
    transform: 'scale(1)',
  },
});

export const contentContainer = style({
  marginTop: 4,
  paddingLeft: levelIndent,
  position: 'relative',
});

export const draggingContainer = style({
  background: cssVar('--affine-background-primary-color'),
  width: '200px',
  borderRadius: '6px',
});

export const draggedOverEffect = style({
  position: 'relative',
  selectors: {
    '&[data-tree-instruction="make-child"][data-self-dragged-over="false"]:after':
      {
        display: 'block',
        content: '""',
        position: 'absolute',
        zIndex: 1,
        background: cssVar('--affine-hover-color'),
        left: levelIndent,
        top: 0,
        width: `calc(100% - ${levelIndent})`,
        height: '100%',
      },
    '&[data-tree-instruction="make-child"][data-self-dragged-over="false"][data-open="false"]:after':
      {
        animation: `${draggedOverAnimation} 1s infinite linear`,
      },
  },
});
