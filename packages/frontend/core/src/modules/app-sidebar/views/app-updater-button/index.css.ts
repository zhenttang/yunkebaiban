import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const root = style({
  display: 'inline-flex',
  background: cssVar('white30'),
  alignItems: 'center',
  borderRadius: '8px',
  border: `1px solid ${cssVar('black10')}`,
  fontSize: cssVar('fontSm'),
  width: '100%',
  height: '52px',
  userSelect: 'none',
  cursor: 'pointer',
  padding: '0 12px',
  position: 'relative',
  transition: 'all 0.3s ease',
  selectors: {
    '&:hover': {
      background: cssVar('white60'),
    },
    '&[data-disabled="true"]': {
      pointerEvents: 'none',
    },
    '&:after': {
      content: "''",
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      width: '8px',
      height: '8px',
      backgroundColor: cssVar('primaryColor'),
      borderRadius: '50%',
      zIndex: 1,
      transition: 'opacity 0.3s',
    },
    '&:hover:after': {
      opacity: 0,
    },
  },
  // SVG 动画已删除，防止图标飞行问题
});
export const icon = style({
  marginRight: '12px',
  color: cssVar('iconColor'),
  fontSize: '24px',
});
export const closeIcon = style({
  position: 'absolute',
  top: '4px',
  right: '4px',
  height: '14px',
  width: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: cssVar('shadow1'),
  color: cssVar('textSecondaryColor'),
  backgroundColor: cssVar('backgroundPrimaryColor'),
  fontSize: '14px',
  cursor: 'pointer',
  transition: '0.1s',
  borderRadius: '50%',
  transform: 'scale(0.6)',
  zIndex: 1,
  opacity: 0,
  selectors: {
    '&:hover': {
      transform: 'scale(1.1)',
    },
    [`${root}:hover &`]: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
});
export const installLabel = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  flex: 1,
  fontSize: cssVar('fontSm'),
  whiteSpace: 'nowrap',
  justifyContent: 'space-between',
});
export const installLabelNormal = style([
  installLabel,
  {
    justifyContent: 'flex-start',
    selectors: {
      [`${root}:hover &, ${root}[data-updating=true] &`]: {
        display: 'none',
      },
    },
  },
]);
export const installLabelHover = style([
  installLabel,
  {
    display: 'none',
    justifyContent: 'flex-start',
    selectors: {
      [`${root}:hover &, ${root}[data-updating=true] &`]: {
        display: 'flex',
      },
    },
  },
]);
export const updateAvailableWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: '8px 0',
});
export const versionLabel = style({
  padding: '0 6px',
  color: cssVar('textSecondaryColor'),
  background: cssVar('backgroundPrimaryColor'),
  fontSize: '10px',
  lineHeight: '18px',
  borderRadius: '4px',
  marginLeft: '8px',
  maxWidth: '100px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
export const whatsNewLabel = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  fontSize: cssVar('fontSm'),
  whiteSpace: 'nowrap',
});
export const ellipsisTextOverflow = style({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
export const progress = style({
  position: 'relative',
  width: '100%',
  height: '4px',
  borderRadius: '12px',
  background: cssVar('black10'),
});
export const progressInner = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  borderRadius: '12px',
  background: cssVar('primaryColor'),
  transition: '0.1s',
});
// particles 样式已禁用，防止动画问题
export const particles = style({
  display: 'none',
});
export const halo = style({
  overflow: 'hidden',
  position: 'absolute',
  inset: 0,
  ':before': {
    content: '""',
    display: 'block',
    inset: 0,
    position: 'absolute',
    filter: 'blur(10px) saturate(1.2)',
    transition: '0.3s ease',
    willChange: 'filter, transform',
    transform: 'translateY(100%) scale(0.6)',
    background:
      'radial-gradient(ellipse 60% 80% at bottom, rgba(30, 150, 235, 0.35), transparent)',
  },
  ':after': {
    content: '""',
    display: 'block',
    inset: 0,
    position: 'absolute',
    filter: 'blur(10px) saturate(1.2)',
    transition: '0.1s ease',
    willChange: 'filter, transform',
    transform: 'translateY(100%) scale(0.6)',
    background:
      'radial-gradient(ellipse 30% 45% at bottom, rgba(30, 150, 235, 0.6), transparent)',
  },
  selectors: {
    [`${root}:hover &:before, ${root}:hover &:after,
      ${root}[data-updating=true] &:before, ${root}[data-updating=true] &:after`]:
      {
        transform: 'translateY(0) scale(1)',
      },
  },
});
