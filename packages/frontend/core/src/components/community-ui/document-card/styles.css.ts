import { style } from '@vanilla-extract/css';
import { communityTheme, baseCard, baseTag, paidBadge, followBadge, publicBadge } from '../styles.css';
import { cssVarV2 } from '@toeverything/theme/v2';

export const cardContainer = style([baseCard, {
  position: 'relative',
  cursor: 'pointer',
}]);

export const cardHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: communityTheme.spacing.md,
  gap: communityTheme.spacing.md,
});

export const titleSection = style({
  flex: 1,
  minWidth: 0, // 允许文本截断
});

export const title = style({
  fontSize: communityTheme.fontSize.lg,
  fontWeight: '600',
  color: cssVarV2('text/primary'),
  margin: 0,
  marginBottom: communityTheme.spacing.xs,
  lineHeight: '1.4',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const badges = style({
  display: 'flex',
  gap: communityTheme.spacing.xs,
  flexWrap: 'wrap',
});

export const description = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
  lineHeight: '1.5',
  marginBottom: communityTheme.spacing.lg,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const tagsContainer = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: communityTheme.spacing.xs,
  marginBottom: communityTheme.spacing.lg,
  maxHeight: '60px',
  overflow: 'hidden',
});

export const tag = style([baseTag]);

export const authorSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.sm,
  marginBottom: communityTheme.spacing.md,
});

export const authorAvatar = style({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: communityTheme.fontSize.xs,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const authorName = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/primary'),
  fontWeight: '500',
});

export const categoryInfo = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
  marginLeft: 'auto',
});

export const statsRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: communityTheme.spacing.lg,
});

export const stats = style({
  display: 'flex',
  gap: communityTheme.spacing.lg,
});

export const statItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.xs,
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
});

export const publishTime = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
});

export const actionsRow = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
  alignItems: 'center',
});

export const actionButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.xs,
  padding: `${communityTheme.spacing.sm} ${communityTheme.spacing.md}`,
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.sm,
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  fontSize: communityTheme.fontSize.xs,
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
    color: cssVarV2('text/primary'),
    borderColor: cssVarV2('text/tertiary'),
  },
});

export const likeButton = style([actionButton, {
  selectors: {
    '&[data-liked="true"]': {
      backgroundColor: `${communityTheme.colors.error}15`,
      borderColor: communityTheme.colors.error,
      color: communityTheme.colors.error,
    },
  },
}]);

export const collectButton = style([actionButton, {
  selectors: {
    '&[data-collected="true"]': {
      backgroundColor: `${communityTheme.colors.warning}15`,
      borderColor: communityTheme.colors.warning,
      color: communityTheme.colors.warning,
    },
  },
}]);

export const viewButton = style([actionButton, {
  backgroundColor: communityTheme.colors.primary,
  color: cssVarV2('pure/white'),
  border: 'none',
  
  ':hover': {
    opacity: 0.8,
    color: cssVarV2('pure/white'),
  },
}]);

export const lockOverlay = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: communityTheme.borderRadius.lg,
  zIndex: 1,
});

export const lockContent = style({
  textAlign: 'center',
  padding: communityTheme.spacing.xl,
});

export const lockIcon = style({
  fontSize: '48px',
  marginBottom: communityTheme.spacing.md,
});

export const lockText = style({
  fontSize: communityTheme.fontSize.md,
  color: cssVarV2('text/primary'),
  fontWeight: '500',
  marginBottom: communityTheme.spacing.sm,
});

export const lockSubtext = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});