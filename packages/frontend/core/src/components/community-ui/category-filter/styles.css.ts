import { style } from '@vanilla-extract/css';
import { communityTheme, baseButton } from '../styles.css';
import { cssVarV2 } from '@toeverything/theme/v2';

export const filterContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: communityTheme.spacing.md,
});

export const filterHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: communityTheme.spacing.sm,
});

export const filterTitle = style({
  fontSize: communityTheme.fontSize.md,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const viewToggle = style({
  display: 'flex',
  gap: '2px',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  borderRadius: communityTheme.borderRadius.sm,
  padding: '2px',
});

export const viewButton = style([baseButton, {
  fontSize: communityTheme.fontSize.xs,
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 'calc(' + communityTheme.borderRadius.sm + ' - 2px)',
  
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: cssVarV2('layer/background/primary'),
      color: cssVarV2('text/primary'),
      boxShadow: cssVarV2('shadow/button'),
    },
  },
}]);

export const gridView = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: communityTheme.spacing.sm,
});

export const listView = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const categoryCard = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: communityTheme.spacing.lg,
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.md,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  
  ':hover': {
    borderColor: communityTheme.colors.primary,
    backgroundColor: cssVarV2('layer/background/tertiary'),
    transform: 'translateY(-1px)',
  },
  
  selectors: {
    '&[data-selected="true"]': {
      borderColor: communityTheme.colors.primary,
      backgroundColor: `${communityTheme.colors.primary}15`,
    },
  },
});

export const categoryIcon = style({
  fontSize: '32px',
  marginBottom: communityTheme.spacing.sm,
  
  '@media': {
    'screen and (max-width: 768px)': {
      fontSize: '24px',
    },
  },
});

export const categoryName = style({
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
  marginBottom: communityTheme.spacing.xs,
  lineHeight: '1.2',
});

export const categoryCount = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
  backgroundColor: cssVarV2('layer/background/primary'),
  padding: `2px ${communityTheme.spacing.xs}`,
  borderRadius: communityTheme.borderRadius.sm,
});

export const categoryListItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.md,
  padding: communityTheme.spacing.md,
  borderRadius: communityTheme.borderRadius.sm,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
  },
  
  selectors: {
    '&[data-selected="true"]': {
      backgroundColor: `${communityTheme.colors.primary}15`,
      borderLeft: `3px solid ${communityTheme.colors.primary}`,
    },
  },
});

export const listItemIcon = style({
  fontSize: '20px',
  width: '20px',
  textAlign: 'center',
});

export const listItemContent = style({
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const listItemName = style({
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const listItemCount = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
  backgroundColor: cssVarV2('layer/background/secondary'),
  padding: `2px ${communityTheme.spacing.sm}`,
  borderRadius: communityTheme.borderRadius.sm,
  minWidth: '24px',
  textAlign: 'center',
});

export const allCategoriesOption = style({
  fontWeight: '600',
  color: communityTheme.colors.primary,
  
  selectors: {
    '&[data-selected="true"]': {
      backgroundColor: `${communityTheme.colors.primary}20`,
    },
  },
});

export const searchBox = style({
  marginBottom: communityTheme.spacing.md,
});

export const searchInput = style({
  width: '100%',
  padding: `${communityTheme.spacing.sm} ${communityTheme.spacing.md}`,
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.sm,
  fontSize: communityTheme.fontSize.sm,
  backgroundColor: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/primary'),
  outline: 'none',
  
  ':focus': {
    borderColor: communityTheme.colors.primary,
    boxShadow: `0 0 0 2px ${communityTheme.colors.primary}33`,
  },
  
  '::placeholder': {
    color: cssVarV2('text/tertiary'),
  },
});

export const emptyState = style({
  textAlign: 'center',
  padding: communityTheme.spacing.xl,
  color: cssVarV2('text/tertiary'),
  fontSize: communityTheme.fontSize.sm,
});

export const loadingState = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: communityTheme.spacing.xl,
  color: cssVarV2('text/secondary'),
  fontSize: communityTheme.fontSize.sm,
});

export const compactView = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: communityTheme.spacing.xs,
});

export const compactCategory = style([baseButton, {
  fontSize: communityTheme.fontSize.xs,
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.sm,
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
    color: cssVarV2('text/primary'),
  },
  
  selectors: {
    '&[data-selected="true"]': {
      backgroundColor: communityTheme.colors.primary,
      color: cssVarV2('pure/white'),
      borderColor: communityTheme.colors.primary,
    },
  },
}]);