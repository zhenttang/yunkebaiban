import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

const baseAction = style({
  display: 'flex',
  gap: 8,
  opacity: 0.6,
});

export const root = style({
  fontSize: cssVar('fontXs'),
  height: 24,
  minHeight: 24,
  width: 'calc(100%)',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 8px 0',
  marginTop: '16px',
  marginBottom: '8px',
  borderRadius: '6px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  selectors: {
    [`&[data-collapsible="true"]`]: {
      cursor: 'pointer',
    },
    [`&[data-collapsible="true"]:hover`]: {
      backgroundColor: cssVarV2('layer/background/hoverOverlay'),
      transform: 'translateX(1px)',
    },
    [`&[data-collapsible="true"]:hover:has(${baseAction}:hover)`]: {
      backgroundColor: 'transparent',
      transform: 'none',
    },
  },
});

export const actions = style([
  baseAction,
  {
    transition: 'opacity 0.2s ease-in-out',
    selectors: {
      [`${root}:hover &`]: {
        opacity: 1,
      },
    },
  },
]);
export const label = style({
  color: cssVarV2('text/tertiary'),
  fontWeight: 600,
  fontSize: cssVar('fontXs'),
  lineHeight: '24px',
  letterSpacing: '0.04em',
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  justifyContent: 'start',
  cursor: 'pointer',
  transition: 'color 0.2s ease-in-out',
  selectors: {
    '&::after': {
      content: '""',
      height: 1,
      minWidth: 24,
      flexGrow: 1,
      marginLeft: 8,
      opacity: 0.28,
      alignSelf: 'center',
      borderRadius: 999,
      background: `linear-gradient(90deg, ${cssVarV2('layer/outline/border')}, rgba(0, 0, 0, 0))`,
    },
    [`${root}:hover &`]: {
      color: cssVarV2('text/secondary'),
    },
  },
});

export const collapseIcon = style({
  vars: { '--y': '1px', '--r': '90deg' },
  color: cssVarV2('icon/tertiary'),
  transform: 'translateY(var(--y)) rotate(var(--r))',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  selectors: {
    [`${root}[data-collapsed="true"] &`]: {
      vars: { '--r': '0deg' },
      transform: 'translateY(var(--y)) rotate(var(--r)) scale(0.9)',
    },
    [`${root}:hover &`]: {
      color: cssVarV2('icon/secondary'),
      transform: 'translateY(var(--y)) rotate(var(--r)) scale(1.1)',
    },
    [`${root}:hover[data-collapsed="true"] &`]: {
      transform: 'translateY(var(--y)) rotate(var(--r)) scale(1.0)',
    },
  },
});
