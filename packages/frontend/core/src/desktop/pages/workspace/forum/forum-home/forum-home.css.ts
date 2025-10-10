import { cssVarV2 } from '@toeverything/theme/v2';
import { style, keyframes } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const content = style({
  padding: '24px',
  flex: 1,
  overflow: 'auto',
  backgroundColor: cssVarV2('layer/background/primary'),
  '@media': {
    '(max-width: 1023px)': {
      padding: '16px',
    },
    '(max-width: 767px)': {
      padding: '12px',
    },
  },
});

export const container = style({
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%',
  containerName: 'forum-container',
  containerType: 'inline-size',
  '@media': {
    '(min-width: 1440px)': {
      maxWidth: '1400px',
    },
    '(max-width: 1023px)': {
      maxWidth: '100%',
    },
  },
});

export const header = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  padding: '24px',
  borderRadius: 12,
  background: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  boxShadow: 'none',
  marginBottom: '20px',
  '@media': {
    '(max-width: 1023px)': {
      padding: '20px',
      gap: '16px',
    },
    '(max-width: 767px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: '16px',
      gap: '16px',
    },
  },
});

// 屏幕阅读器专用文本
export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  '@media': {
    '(max-width: 767px)': {
      gap: '4px',
    },
  },
});

export const title = style({
  fontSize: '28px',
  fontWeight: 700,
  color: cssVarV2('text/primary'),
  margin: 0,
  '@media': {
    '(max-width: 1023px)': {
      fontSize: '24px',
    },
    '(max-width: 767px)': {
      fontSize: '20px',
    },
  },
});

export const subtitle = style({
  margin: 0,
  color: cssVarV2('text/secondary'),
  fontSize: '14px',
  '@media': {
    '(max-width: 767px)': {
      fontSize: '13px',
    },
  },
});

export const section = style({
  marginTop: '24px',
});

export const sectionTitle = style({
  fontSize: '18px',
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  margin: '0 0 12px 0',
});

export const card = style({
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  borderRadius: 12,
  backgroundColor: cssVarV2('layer/background/secondary'),
  boxShadow: 'none',
  padding: '12px 0',
});

// 旧 node 系列样式将由新表格风格样式替代

// 旧 node 系列样式将由新表格风格样式替代

// 旧 node 系列样式将由新表格风格样式替代

// 旧 node 系列样式将由新表格风格样式替代

// 旧 node 系列样式将由新表格风格样式替代

export const hint = style({
  padding: '20px',
  textAlign: 'center',
  color: cssVarV2('text/tertiary'),
});

export const status = style({
  padding: '24px',
  textAlign: 'center',
  color: cssVarV2('text/secondary'),
});

// ============ 新的表格风格样式 ============
export const collapseBtn = style({
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  color: cssVarV2('icon/secondary'),
  transition: 'color 0.15s ease',
  flexShrink: 0,
  ':hover': {
    color: cssVarV2('icon/primary'),
  },
  '@media': {
    '(max-width: 767px)': {
      width: 32,
      height: 32,
      padding: 6,
    },
  },
});

export const collapseIcon = style({
  width: 0,
  height: 0,
  borderLeft: '5px solid transparent',
  borderRight: '5px solid transparent',
  borderTop: `6px solid currentColor`,
  transition: 'transform 0.2s ease',
  selectors: {
    '[data-collapsed="true"] &': {
      transform: 'rotate(-90deg)'
    }
  }
});

export const collapsePlaceholder = style({
  width: 20,
  height: 20,
  flexShrink: 0,
});

export const forumIcon = style({
  fontSize: '24px',
  lineHeight: 1,
  flexShrink: 0,
  width: 28,
  textAlign: 'center',
  '@media': {
    '(max-width: 1023px)': {
      fontSize: '22px',
      width: 24,
    },
    '(max-width: 767px)': {
      fontSize: '20px',
      width: 22,
    },
  },
});

export const forumInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
  minWidth: 0,
});

export const forumName = style({
  fontSize: '15px',
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  margin: 0,
  lineHeight: 1.4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 767px)': {
      fontSize: '14px',
      whiteSpace: 'normal',
      WebkitLineClamp: 2,
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
    },
  },
});

export const forumDesc = style({
  fontSize: '13px',
  color: cssVarV2('text/secondary'),
  margin: 0,
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '@media': {
    '(max-width: 1023px)': {
      fontSize: '12px',
      WebkitLineClamp: 1,
    },
    '(max-width: 767px)': {
      display: 'none',
    },
  },
});

export const forumRow = style({
  display: 'flex',
  alignItems: 'center',
  padding: '16px 20px',
  gap: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  selectors: {
    '&:hover': {
      backgroundColor: cssVarV2('layer/background/hoverOverlay'),
    },
  },
  '@media': {
    '(max-width: 1023px)': {
      padding: '14px 16px',
      gap: '12px',
    },
    '(max-width: 767px)': {
      padding: '12px',
      gap: '10px',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
});

export const forumItem = style({
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
    },
    '&[data-level="1"]': {
      backgroundColor: cssVarV2('layer/background/primary'),
    },
    '&[data-level="2"]': {
      backgroundColor: cssVarV2('layer/background/primary'),
      opacity: 0.95,
    },
  },
});

export const forumMain = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  flex: 1,
  minWidth: 0,
  '@media': {
    '(max-width: 1023px)': {
      gap: '10px',
    },
    '(max-width: 767px)': {
      width: '100%',
      gap: '8px',
    },
  },
});

export const forumStats = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
  minWidth: '140px',
  justifyContent: 'flex-end',
  '@media': {
    '(max-width: 1023px)': {
      minWidth: '120px',
      gap: '6px',
    },
    '(max-width: 767px)': {
      width: '100%',
      minWidth: 'auto',
      justifyContent: 'space-between',
      marginLeft: '30px',
    },
  },
});

export const stat = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
});

export const statValue = style({
  fontSize: '14px',
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  fontVariantNumeric: 'tabular-nums',
});

export const statLabel = style({
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
  '@media': {
    '(max-width: 1023px)': {
      fontSize: '11px',
    },
  },
});

export const statDivider = style({
  color: cssVarV2('text/disable'),
  fontSize: '12px',
  userSelect: 'none',
});

export const forumActivity = style({
  flexShrink: 0,
  minWidth: '100px',
  textAlign: 'right',
  '@media': {
    '(max-width: 1023px)': {
      minWidth: '80px',
    },
    '(max-width: 767px)': {
      width: '100%',
      minWidth: 'auto',
      textAlign: 'left',
      marginLeft: '30px',
    },
  },
});

export const activityTime = style({
  fontSize: '13px',
  color: cssVarV2('text/secondary'),
  fontVariantNumeric: 'tabular-nums',
  '@media': {
    '(max-width: 1023px)': {
      fontSize: '12px',
    },
  },
});

export const forumChildren = style({
  paddingLeft: '32px',
  '@media': {
    '(max-width: 1023px)': {
      paddingLeft: '24px',
    },
    '(max-width: 767px)': {
      paddingLeft: '16px',
    },
  },
});

// 删除三栏布局，改为单栏列表容器
export const forumList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  borderRadius: 12,
  backgroundColor: cssVarV2('layer/background/secondary'),
  boxShadow: 'none',
  overflow: 'hidden',
});

export const emptySearch = style({
  padding: '60px 20px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
});

export const emptyIcon = style({
  fontSize: '48px',
  opacity: 0.5,
});

export const emptyText = style({
  fontSize: '15px',
  color: cssVarV2('text/secondary'),
  margin: 0,
});

export const clearSearch = style({
  padding: '8px 16px',
  borderRadius: 8,
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  background: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/primary'),
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.15s ease',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
    borderColor: cssVarV2('layer/outline/floating'),
  },
});

// ============ 增强搜索样式 ============
export const searchContainer = style({
  position: 'relative',
  '@media': {
    '(max-width: 767px)': {
      width: '100%',
    },
  },
});

export const searchInputWrapper = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const searchIcon = style({
  position: 'absolute',
  left: '12px',
  color: cssVarV2('icon/secondary'),
  pointerEvents: 'none',
});

export const matchCount = style({
  position: 'absolute',
  right: '40px',
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
  fontVariantNumeric: 'tabular-nums',
  pointerEvents: 'none',
});

export const clearBtn = style({
  position: 'absolute',
  right: '8px',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: cssVarV2('icon/secondary'),
  cursor: 'pointer',
  borderRadius: 6,
  transition: 'all 0.15s ease',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
    color: cssVarV2('icon/primary'),
  },
});

export const searchHistory = style({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  background: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  borderRadius: 10,
  boxShadow: 'none',
  overflow: 'hidden',
  zIndex: 100,
  '@media': {
    '(max-width: 767px)': {
      position: 'fixed',
      top: 'auto',
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: '16px 16px 0 0',
      maxHeight: '50vh',
      overflow: 'auto',
    },
  },
});

export const historyHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
});

export const historyTitle = style({
  fontSize: '12px',
  fontWeight: 600,
  color: cssVarV2('text/secondary'),
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

export const historyClear = style({
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 4,
  transition: 'all 0.15s ease',
  ':hover': {
    color: cssVarV2('text/primary'),
    background: cssVarV2('layer/background/hoverOverlay'),
  },
});

export const historyList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const historyItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  color: cssVarV2('text/primary'),
  transition: 'background 0.15s ease',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
  },
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
    },
  },
});

export const historyIcon = style({
  color: cssVarV2('icon/secondary'),
  flexShrink: 0,
});

export const highlight = style({
  background: cssVarV2('layer/background/hoverOverlay'),
  color: cssVarV2('text/primary'),
  padding: '1px 2px',
  borderRadius: 3,
  fontWeight: 600,
});

// ============ 骨架屏 ============
const shimmer = keyframes({
  '0%': { backgroundPosition: '-400px 0' },
  '100%': { backgroundPosition: '400px 0' },
});

export const skeletonList = style({
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  borderRadius: 12,
  backgroundColor: cssVarV2('layer/background/secondary'),
  boxShadow: 'none',
  overflow: 'hidden',
});

export const skeletonRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px 20px',
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${cssVarV2('layer/outline/border')}`,
    },
  },
});

export const skeletonBlock = style({
  height: 12,
  borderRadius: 6,
  background: `linear-gradient(90deg, ${cssVarV2('layer/background/hoverOverlay')} 25%, ${cssVarV2('layer/background/primary')} 37%, ${cssVarV2('layer/background/hoverOverlay')} 63%)`,
  backgroundSize: '400px 100%',
  animation: `${shimmer} 1.2s ease-in-out infinite`,
});

// 侧栏相关样式不再使用

// 侧栏相关样式不再使用

export const search = style({
  width: '320px',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/primary'),
  outline: 'none',
  transition: 'box-shadow .15s ease, border-color .15s ease',
  ':focus': {
    borderColor: cssVarV2('layer/outline/floating'),
    boxShadow: 'none',
  },
  '@media': {
    '(max-width: 1023px)': {
      width: '280px',
    },
    '(max-width: 767px)': {
      width: '100%',
    },
  },
});

// 主区域栅格不再需要

// 主区域栅格不再需要

// 右侧面板不再需要

