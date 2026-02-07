import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

export const iconColor = createVar('iconColor');
export const labelColor = createVar('labelColor');
export const bgColor = createVar('bgColor');

// 确保在modal={false}时，Radix UI的遮罩层不会显示
// Radix UI的DropdownMenu在modal={false}时不应该有遮罩层，但添加此样式作为保险
globalStyle('[data-radix-dropdown-menu-backdrop]', {
  display: 'none !important',
  visibility: 'hidden !important',
  opacity: '0 !important',
});

// 禁用菜单关闭时的所有 transition 动画，防止图标飞行效果
globalStyle('[data-radix-menu-content] *', {
  transition: 'none !important',
});
globalStyle('[data-radix-dropdown-menu-content] *', {
  transition: 'none !important',
});

export const menuContent = style({
  minWidth: '180px',
  borderRadius: '8px',
  padding: '8px',
  fontSize: cssVar('fontSm'),
  fontWeight: '400',
  backgroundColor: cssVarV2('layer/background/overlayPanel'),
  boxShadow: cssVar('menuShadow'),
  userSelect: 'none',
  ['WebkitAppRegion' as string]: 'no-drag',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  // 禁用 transition 防止关闭时飞行动画
  transition: 'none !important',
  selectors: {
    '&.mobile': {
      padding: 0,
      boxShadow: 'none',
    },
  },
});

export const menuItem = style({
  vars: {
    [iconColor]: cssVarV2('icon/primary'),
    [labelColor]: cssVarV2('text/primary'),
    [bgColor]: 'transparent',
  },
  color: labelColor,
  backgroundColor: bgColor,
  // 禁用 transition 防止关闭时图标飞行动画
  transition: 'none !important',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '4px',
  borderRadius: 4,
  lineHeight: '22px',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
  selectors: {
    '&.block': {
      maxWidth: '100%',
    },
    '&[data-disabled], &.disabled': {
      vars: {
        [iconColor]: cssVarV2('icon/disable'),
        [labelColor]: cssVarV2('text/secondary'),
      },
      pointerEvents: 'none',
      cursor: 'default',
    },
    '&:hover': {
      vars: {
        [bgColor]: cssVar('hoverColor'),
      },
      outline: 'none !important',
    },
    '&:focus-visible': {
      outline: '1px solid ' + cssVarV2('layer/insideBorder/primaryBorder'),
    },
    '&.danger:hover': {
      vars: {
        [iconColor]: cssVar('errorColor'),
        [labelColor]: cssVar('errorColor'),
        [bgColor]: cssVar('backgroundErrorColor'),
      },
    },
    '&.warning:hover': {
      vars: {
        [iconColor]: cssVar('warningColor'),
        [labelColor]: cssVar('warningColor'),
        [bgColor]: cssVar('backgroundWarningColor'),
      },
    },
    '&.checked, &.selected': {
      vars: {
        [iconColor]: cssVar('primaryColor'),
      },
    },
  },
});
export const menuSpan = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left',
  // 禁用 transition 防止关闭时飞行动画
  transition: 'none !important',
});
export const menuItemIcon = style({
  display: 'flex',
  flexShrink: 0,
  fontSize: cssVar('fontH5'),
  color: iconColor,
  width: 20,
  height: 20,
  // 禁用 transition 防止关闭时图标飞行动画
  transition: 'none !important',
});

export const menuSeparator = style({
  width: '100%',
  height: '8px',
  position: 'relative',
  ':after': {
    content: '""',
    display: 'block',
    height: '1px',
    width: '100%',
    backgroundColor: cssVarV2('layer/insideBorder/border'),
    position: 'absolute',
    top: '50%',
    left: 0,
    transform: 'translateY(-50%) scaleY(0.5)',
  },
});
