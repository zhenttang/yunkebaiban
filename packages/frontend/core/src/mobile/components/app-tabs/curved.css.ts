import { cssVarV2 } from '@toeverything/theme/v2';
import { createVar, style } from '@vanilla-extract/css';

import { globalVars } from '../../styles/variables.css';

export const curvedTabsBackground = createVar('curvedTabsBackground');

export const curvedTabs = style({
  vars: {
    [curvedTabsBackground]: cssVarV2.layer.background.mobile.primary,
  },
  position: 'relative',
  width: '100dvw',
  zIndex: 1,
  marginBottom: -2,
  selectors: {
    '&[data-fixed="true"]': {
      position: 'fixed',
      bottom: -2,
      marginBottom: 0,
      left: 0,
      right: 0,
    },
  },
});

export const curvedTabsInner = style({
  height: `calc(${globalVars.appTabHeight} + 2px)`,
  position: 'relative',
});

export const svgWrap = style({
  position: 'absolute',
  left: 0,
  right: 0,
});

export const buttonsRow = style({
  position: 'absolute',
  left: 0,
  right: 0,
  display: 'flex',
  height: 100, // clickable area similar to flutter sample
});

export const buttonCell = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  willChange: 'transform, opacity',
  transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
  transform: 'translateZ(0)',
});

export const floating = style({
  position: 'absolute',
  width: 52,
  height: 52,
  borderRadius: 26,
  background: cssVarV2('layer/background/primary'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  willChange: 'transform, left, bottom',
  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), left 0.45s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
  transform: 'translateZ(0)',
});

export const iconStyle = style({
  fontSize: 30,
  lineHeight: 0,
  color: cssVarV2.icon.primary,
  selectors: {
    '&[data-active="true"]': {
      color: cssVarV2.button.primary,
    },
  },
});
