import { style, globalStyle } from '@vanilla-extract/css';
import { cssVarV2 } from '@toeverything/theme/v2';

// 通用样式变量
export const communityTheme = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    xxl: '32px',
  },
  colors: {
    primary: cssVarV2('button/primary'),
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
  },
};

// 基础卡片样式
export const baseCard = style({
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.lg,
  padding: communityTheme.spacing.xl,
  transition: 'all 0.2s ease',
  
  ':hover': {
    borderColor: communityTheme.colors.primary,
    boxShadow: cssVarV2('shadow/popover'),
    transform: 'translateY(-2px)',
  },
});

// 基础按钮样式
export const baseButton = style({
  padding: `${communityTheme.spacing.sm} ${communityTheme.spacing.lg}`,
  border: 'none',
  borderRadius: communityTheme.borderRadius.sm,
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: communityTheme.spacing.sm,
  
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

// 主要按钮样式
export const primaryButton = style([baseButton, {
  backgroundColor: communityTheme.colors.primary,
  color: cssVarV2('pure/white'),
  
  ':hover:not(:disabled)': {
    opacity: 0.8,
  },
}]);

// 次要按钮样式
export const secondaryButton = style([baseButton, {
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  
  ':hover:not(:disabled)': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
    color: cssVarV2('text/primary'),
  },
}]);

// 危险按钮样式
export const dangerButton = style([baseButton, {
  backgroundColor: communityTheme.colors.error,
  color: cssVarV2('pure/white'),
  
  ':hover:not(:disabled)': {
    opacity: 0.8,
  },
}]);

// 输入框样式
export const baseInput = style({
  width: '100%',
  padding: `${communityTheme.spacing.md} ${communityTheme.spacing.lg}`,
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.md,
  fontSize: communityTheme.fontSize.sm,
  backgroundColor: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/primary'),
  outline: 'none',
  transition: 'border-color 0.2s ease',
  
  ':focus': {
    borderColor: communityTheme.colors.primary,
    boxShadow: `0 0 0 2px ${communityTheme.colors.primary}33`,
  },
  
  '::placeholder': {
    color: cssVarV2('text/tertiary'),
  },
});

// 标签基础样式
export const baseTag = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  borderRadius: communityTheme.borderRadius.sm,
  fontSize: communityTheme.fontSize.xs,
  fontWeight: '500',
  color: cssVarV2('pure/white'),
  gap: communityTheme.spacing.xs,
});

// 徽章样式
export const baseBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  borderRadius: communityTheme.borderRadius.sm,
  fontSize: communityTheme.fontSize.xs,
  fontWeight: '500',
  whiteSpace: 'nowrap',
});

export const paidBadge = style([baseBadge, {
  backgroundColor: communityTheme.colors.error,
  color: cssVarV2('pure/white'),
}]);

export const followBadge = style([baseBadge, {
  backgroundColor: communityTheme.colors.info,
  color: cssVarV2('pure/white'),
}]);

export const publicBadge = style([baseBadge, {
  backgroundColor: communityTheme.colors.success,
  color: cssVarV2('pure/white'),
}]);

// 加载状态样式
export const loadingSpinner = style({
  display: 'inline-block',
  width: '16px',
  height: '16px',
  border: '2px solid transparent',
  borderTop: `2px solid ${cssVarV2('text/secondary')}`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
});

globalStyle(`${loadingSpinner}`, {
  '@keyframes': {
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
});

// 空状态样式
export const emptyState = style({
  textAlign: 'center',
  padding: `${communityTheme.spacing.xxl} ${communityTheme.spacing.xl}`,
  color: cssVarV2('text/tertiary'),
});

// 响应式网格
export const responsiveGrid = style({
  display: 'grid',
  gap: communityTheme.spacing.xl,
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  
  '@media': {
    'screen and (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: communityTheme.spacing.lg,
    },
  },
});