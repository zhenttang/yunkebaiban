import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
  width: '100vw',
  height: '100vh',
  display: 'flex',
  background: cssVarV2('layer/background/primary'),
  color: cssVar('textPrimaryColor'),
});
globalStyle(`${root} *`, {
  boxSizing: 'border-box',
});

export const sidebar = style({
  flexShrink: 0,
  width: 240,
  borderRight: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  position: 'relative',
});

export const sidebarResizer = style({
  position: 'absolute',
  top: 0,
  right: -4,
  width: 8,
  height: '100%',
  cursor: 'col-resize',
  zIndex: 10,
  backgroundColor: 'transparent',
  transition: 'background-color 0.2s',
  selectors: {
    '&:hover': {
      backgroundColor: cssVarV2('layer/background/hoverOverlay'),
    },
  },
});
export const content = style({
  width: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

export const sidebarHeader = style({
  padding: '8px 48px',
  background: cssVarV2('layer/background/primary'),
  borderBottom: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});
export const sidebarScrollable = style({
  height: 0,
  flex: 1,
  padding: '8px 8px 0px 8px',
});

export const mainHeader = style({});
export const mainScrollable = style({
  height: 0,
  flex: 1,
});
export const mainViewport = style({
  display: 'flex',
  flexDirection: 'column',
});
export const row = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 0,

  selectors: {
    'header &': {
      fontWeight: 500,
      fontSize: cssVar('fontSm'),
      lineHeight: '22px',
      padding: '9px 0',
      borderBottom: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
    },
    [`${mainViewport} &`]: {
      padding: '4px 0',
    },
    [`${mainViewport} &:not(:last-child)`]: {
      borderBottom: `0.5px solid ${cssVarV2('layer/insideBorder/border')}`,
    },
  },
});
globalStyle(`${row} > li`, {
  width: 0,
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 8px',
});

export const treeNode = style({
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 8,
  color: cssVar('textPrimaryColor'),
  cursor: 'pointer',
  selectors: {
    '&[data-active="true"]': {
      color: cssVar('brandColor'),
    },
    '&[data-checked="true"], &:hover': {
      background: cssVarV2('layer/background/hoverOverlay'),
    },
    '&[data-customized="true"]': {
      textDecoration: 'underline',
    },
  },
});

globalStyle(`${treeNode} > span`, {
  flex: 1,
  minWidth: 0,
  wordBreak: 'break-word',
  lineHeight: '1.5',
});
export const treeNodeContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  paddingLeft: 32,
  paddingTop: 4,
  paddingBottom: 4,
});
export const treeNodeIconWrapper = style({
  color: cssVarV2('icon/secondary'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
});
export const treeNodeCollapseIcon = style({
  transition: 'transform 0.2s',
  transform: 'rotate(-90deg)',
  selectors: {
    '&[data-open="true"]': {
      transform: 'rotate(0deg)',
    },
  },
});

export const colorCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: cssVar('fontXs'),
  width: 220,
});
export const colorCellRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  position: 'relative',
  minHeight: 23,
  selectors: {
    '&[data-empty="true"]': {
      display: 'none',
    },
    '&[data-override="true"]': {
      opacity: 0.1,
      textDecoration: 'line-through',
    },
  },
});
export const colorCellColor = style({
  flexShrink: 0,
  width: 16,
  height: 16,
  borderRadius: 4,
  position: 'relative',
  cursor: 'pointer',
  transition: 'transform 0.1s',
  selectors: {
    '&:hover': {
      transform: 'scale(1.1)',
    },
    [`${colorCellRow}[data-custom] &`]: {
      borderRadius: '50%',
    },
  },
  ':before': {
    width: 16,
    height: 16,
    position: 'absolute',
    content: '""',
    borderRadius: 'inherit',
    left: 0,
    top: 0,
    border: `1px solid rgba(0,0,0,0.1)`,
    boxSizing: 'border-box',
  },
});
export const colorCellValue = style({
  padding: '4px 8px',
  borderRadius: 4,
  background: 'rgba(125,125,125,0.1)',
});
export const colorCellInput = style({
  width: '100%',
  height: 32,
});

export const previewPopoverContent = style({
  padding: 16,
  background: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  maxWidth: 300,
  zIndex: 100,
});

export const previewImage = style({
  width: '100%',
  height: 'auto',
  borderRadius: 4,
  marginBottom: 8,
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const previewContext = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.5',
});
