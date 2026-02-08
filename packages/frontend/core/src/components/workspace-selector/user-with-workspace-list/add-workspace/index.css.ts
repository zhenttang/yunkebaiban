import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const ItemContainer = style({
  // 布局属性 - 必须保留
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '6px 16px 6px 11px',
  gap: '12px',
  width: '100%',
  // 外观属性
  cursor: 'pointer',
  borderRadius: '8px',
  // 禁用所有动画和过渡，防止飞行问题
  animation: 'none !important',
  transition: 'background-color 0.2s !important',
  transform: 'none !important',
});
export const prefixIcon = style({
  width: 24,
  height: 24,
  fontSize: 24,
  color: cssVarV2.icon.secondary,
});
export const ItemText = style({
  fontSize: cssVar('fontSm'),
  lineHeight: '22px',
  color: cssVarV2.text.secondary,
  fontWeight: 400,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
