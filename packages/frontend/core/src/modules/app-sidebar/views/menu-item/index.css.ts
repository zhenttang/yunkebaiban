import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';
export const linkItemRoot = style({
  color: 'inherit',
});
export const root = style({
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
  marginTop: '2px',
  marginBottom: '2px',
  position: 'relative',
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
    '&[data-collapsible="true"]': {
      paddingLeft: '8px',
      paddingRight: '8px',
    },
    '&[data-collapsible="false"]:is([data-active="true"], :hover)': {
      width: 'calc(100% + 16px)',
      transform: 'translateX(-8px)',
      paddingLeft: '24px',
      paddingRight: '12px',
      borderRadius: '12px',
    },
    [`${linkItemRoot}:first-of-type &`]: {
      marginTop: '0px',
    },
  },
});
export const content = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
});
export const postfix = style({
  right: '4px',
  position: 'absolute',
  opacity: 0,
  pointerEvents: 'none',
  selectors: {
    [`${root}:hover &, &[data-postfix-display="always"]`]: {
      justifySelf: 'flex-end',
      position: 'initial',
      opacity: 1,
      pointerEvents: 'all',
    },
  },
});
export const icon = style({
  color: cssVarV2('icon/primary'),
  fontSize: '20px',
});
export const collapsedIconContainer = style({
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  color: 'inherit',
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
export const iconsContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  minWidth: '32px',
  flexShrink: 0,
  selectors: {
    '&[data-collapsible="true"]': {
      width: '48px',
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
export const spacer = style({
  flex: 1,
});
