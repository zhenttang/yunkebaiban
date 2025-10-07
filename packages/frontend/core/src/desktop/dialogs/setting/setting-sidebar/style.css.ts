import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

export const settingSlideBar = style({
  width: 'min(26%, 260px)',
  backgroundColor: cssVarV2('layer/background/secondary'),
  padding: '24px clamp(12px, 3vw, 20px)',
  height: '100%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  overflowY: 'auto',
  borderRight: `1px solid ${cssVarV2('layer/outline/border')}`,
  boxShadow: `inset -1px 0 0 0 ${cssVarV2('layer/outline/border')}`,
  '@media': {
    'screen and (max-width: 1180px)': {
      width: 'min(32%, 240px)',
    },
    'screen and (max-width: 860px)': {
      width: '100%',
      flexDirection: 'row',
      overflowX: 'auto',
      borderRight: 'none',
      borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
      boxShadow: 'none',
      padding: '16px',
      gap: '12px',
    },
  },
});

globalStyle(`${settingSlideBar}::-webkit-scrollbar`, {
  width: 6,
  height: 6,
});

globalStyle(`${settingSlideBar}::-webkit-scrollbar-thumb`, {
  borderRadius: 999,
  background: cssVarV2('layer/outline/border'),
});

globalStyle(`${settingSlideBar}::-webkit-scrollbar-thumb:hover`, {
  background: cssVarV2('layer/outline/floating'),
});

export const sidebarTitle = style({
  fontSize: 16,
  fontWeight: 700,
  lineHeight: '22px',
  color: cssVarV2('text/primary'),
  padding: '0 8px',
});

export const sidebarSubtitle = style({
  fontSize: 13,
  lineHeight: '20px',
  color: cssVarV2('text/tertiary'),
  padding: '6px 8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const sidebarItemsWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const sidebarSelectItem = style({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 10px',
  minHeight: '36px',
  flexShrink: 0,
  fontSize: 13,
  borderRadius: '10px',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
  },
  selectors: {
    '&.active': {
      background: cssVarV2('layer/background/hoverOverlay'),
      color: cssVarV2('text/primary'),
    },
  },
});

export const sidebarSelectSubItem = style({
  display: 'flex',
  alignItems: 'center',
  margin: '0 16px',
  padding: '4px 8px 4px 36px',
  minHeight: '32px',
  flexShrink: 0,
  fontSize: 12,
  borderRadius: '8px',
  cursor: 'pointer',
  userSelect: 'none',
  color: cssVarV2('text/tertiary'),
  selectors: {
    '&.active, &:hover': {
      color: cssVarV2('text/primary'),
      background: cssVarV2('layer/background/hoverOverlay'),
    },
  },
});

export const sidebarSelectItemIcon = style({
  width: 18,
  height: 18,
  fontSize: 18,
  marginRight: '12px',
  flexShrink: 0,
  color: cssVarV2('icon/primary'),
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const sidebarSelectItemName = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexGrow: 1,
});

export const sidebarSelectItemBeta = style({
  fontSize: 11,
  color: cssVarV2('text/inverse'),
  background: cssVarV2('chip/label/blue'),
  height: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 8px',
  borderRadius: '4px',
  transform: 'translateX(2px)',
});

export const currentWorkspaceLabel = style({
  width: 20,
  height: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  selectors: {
    '&::after': {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: cssVarV2('status/success'),
    },
  },
});

export const sidebarGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '14px 12px',
  borderRadius: '16px',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
  boxShadow: cssVarV2('shadow/popover'),
  '@media': {
    'screen and (max-width: 860px)': {
      minWidth: '260px',
    },
  },
});

export const accountButton = style({
  padding: '6px 10px',
  borderRadius: '12px',
  cursor: 'pointer',
  userSelect: 'none',
  display: 'flex',
  columnGap: '12px',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
  },
  selectors: {
    '&.active': {
      background: cssVarV2('layer/background/hoverOverlay'),
      borderColor: cssVarV2('layer/outline/floating'),
    },
  },
});

globalStyle(`${accountButton} .avatar`, {
  width: 32,
  height: 32,
  borderRadius: '50%',
  fontSize: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0,
  backgroundColor: cssVarV2('layer/background/secondary'),
});

globalStyle(`${accountButton} .avatar.not-sign`, {
  color: cssVarV2('icon/primary'),
  background: cssVarV2('layer/background/tertiary'),
  paddingBottom: '2px',
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
});

globalStyle(`${accountButton} .content`, {
  flexGrow: 1,
  minWidth: 0,
});

globalStyle(`${accountButton} .name-container`, {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  gap: '6px',
  height: '24px',
});

globalStyle(`${accountButton} .name`, {
  fontSize: 13,
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  height: 22,
  color: cssVarV2('text/primary'),
});

globalStyle(`${accountButton} .email`, {
  fontSize: 12,
  color: cssVarV2('text/tertiary'),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexGrow: 1,
  height: '20px',
});

const focusOutline = {
  outline: `2px solid ${cssVarV2('button/primary')}`,
  outlineOffset: 2,
};

globalStyle(`${sidebarSelectItem}:focus-visible`, focusOutline);

globalStyle(`${sidebarSelectSubItem}:focus-visible`, focusOutline);

globalStyle(`${accountButton}:focus-visible`, focusOutline);
