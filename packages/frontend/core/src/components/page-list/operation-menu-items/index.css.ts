import { cssVar } from '@toeverything/theme';
import { globalStyle, style } from '@vanilla-extract/css';
export const moveToTrashStyle = style({
  padding: '4px 12px',
  ':hover': {
    backgroundColor: cssVar('backgroundErrorColor'),
    color: cssVar('errorColor'),
  },
});
globalStyle(`${moveToTrashStyle}:hover svg`, {
  color: cssVar('errorColor'),
});
export const transitionStyle = style({
  // 只对背景色和颜色应用过渡，避免位置变化时产生飞行动画
  transition: 'background-color 0.2s, color 0.2s',
});
