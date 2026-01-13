import { createVar, globalStyle, style } from '@vanilla-extract/css';

const bgColor = createVar();
const dotColor = createVar();

export const root = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: -1,
});

export const dotBg = style({
  height: '100%',
  width: '100%',
  position: 'absolute',
  zIndex: -1,
  top: 0,
  left: 0,
  // 更轻量的点阵背景（A+B），缩小点径并降低密度
  backgroundImage: `linear-gradient(to bottom, transparent 0%, ${bgColor} 88%),
     radial-gradient(${dotColor} 1.5px, transparent 1.5px),
     radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
  backgroundSize: '100% 100%, 24px 24px, 24px 24px',
  opacity: 0.5,
});

export const arts = style({
  paddingTop: 60,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '@media': {
    // A：小屏下不需要额外动画图片
    '(prefers-reduced-motion: reduce)': {
      display: 'none',
    },
  },
});

globalStyle(`[data-theme="light"] ${root}`, {
  vars: {
    [bgColor]: '#fff',
    [dotColor]: '#d9d9d9',
  },
});

globalStyle(`[data-theme="dark"] ${root}`, {
  vars: {
    [bgColor]: '#141414',
    [dotColor]: '#393939',
  },
});
