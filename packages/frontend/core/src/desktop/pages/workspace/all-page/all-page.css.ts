import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0, // 关键：避免 flex 子项无限扩展，确保可以滚动
  height: '100%',
  width: '100%',
  containerName: 'docs-body',
  containerType: 'size',
});

export const mainContainer = style({
  width: '100%',
  margin: '0 auto',
  maxWidth: '1280px',
  padding: '0 40px 48px 40px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1, // 关键：让容器占用可用空间
  minHeight: 0, // 关键：避免 flex 子项无限扩展
  gap: 32, // Increased gap
  '@container': {
    'docs-body (width <= 1024px)': {
      padding: '0 32px 40px 32px',
    },
    'docs-body (width <= 768px)': {
      padding: '0 24px 32px 24px',
      gap: 24,
    },
    'docs-body (width <= 480px)': {
      padding: '0 16px 24px 16px',
      gap: 16,
    },
  },
});

export const banner = style({
  width: '100%',
});

export const card = style({
  borderRadius: 20, // Increased radius
  background: cssVarV2('layer/background/primary'),
  // Softer border or remove it if shadow is enough
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
  // More diffused shadow
  boxShadow: '0px 10px 30px rgba(15, 23, 42, 0.04)',
  transition: 'all .2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0px 15px 35px rgba(15, 23, 42, 0.08)',
  }
});

export const pinnedCard = style([
  card,
  {
    padding: '20px 24px', // Increased padding
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    // Subtle gradient for pinned section
    background: `linear-gradient(180deg, ${cssVarV2('layer/background/secondary')} 0%, ${cssVarV2('layer/background/primary')} 100%)`,
  },
]);

export const filterCard = style([
  card,
  {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
]);

export const filterHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
});

export const filterSummary = style({
  fontSize: 14,
  color: cssVarV2('text/secondary'),
});

export const filterContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const filterControls = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const filterActionsSpacer = style({
  flex: 1,
});

export const filters = style({
  flex: 1,
});

export const documentsContainer = style([
  card,
  {
    background: cssVarV2('layer/background/primary'), // Clean background
    border: `1px solid ${cssVarV2('layer/outline/floating')}`,
    padding: '32px', // Increased padding
    display: 'flex',
    flexDirection: 'column',
    flex: 1, // 关键：让文档容器占用剩余空间
    minHeight: 0, // 关键：避免 flex 子项无限扩展，确保可以滚动
    overflow: 'hidden', // 关键：隐藏溢出，让内部滚动容器处理滚动
    '@container': {
      'docs-body (width <= 768px)': {
        padding: '24px',
      },
      'docs-body (width <= 500px)': {
        padding: '16px',
      },
    },
  },
]);

export const sectionTitle = style({
  fontSize: 14,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
});

export const scrollArea = style({
  height: 0,
  flex: 1,
});

export const documentsInner = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  flex: 1, // 关键：让内部容器占用可用空间
  minHeight: 0, // 关键：避免 flex 子项无限扩展，确保滚动容器有明确高度
  overflow: 'hidden', // 关键：隐藏溢出，让 Scrollable 组件处理滚动
});
