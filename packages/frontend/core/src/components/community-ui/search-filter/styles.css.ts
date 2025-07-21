import { style } from '@vanilla-extract/css';
import { communityTheme, baseInput, baseButton, primaryButton, secondaryButton } from '../styles.css';
import { cssVarV2 } from '@toeverything/theme/v2';

export const filterContainer = style({
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.lg,
  padding: communityTheme.spacing.xl,
  marginBottom: communityTheme.spacing.xl,
});

export const searchSection = style({
  marginBottom: communityTheme.spacing.lg,
});

export const searchBox = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
  marginBottom: communityTheme.spacing.md,
  
  '@media': {
    'screen and (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
});

export const searchInput = style([baseInput, {
  flex: 1,
}]);

export const searchButton = style([primaryButton]);

export const quickFilters = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
  flexWrap: 'wrap',
});

export const quickFilterButton = style([secondaryButton, {
  fontSize: communityTheme.fontSize.xs,
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.md}`,
  
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: communityTheme.colors.primary,
      color: cssVarV2('pure/white'),
      borderColor: communityTheme.colors.primary,
    },
  },
}]);

export const filtersGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: communityTheme.spacing.lg,
  marginBottom: communityTheme.spacing.lg,
  
  '@media': {
    'screen and (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: communityTheme.spacing.md,
    },
  },
});

export const filterGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: communityTheme.spacing.sm,
});

export const filterLabel = style({
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const filterSelect = style([baseInput, {
  cursor: 'pointer',
}]);

export const priceRangeContainer = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
  alignItems: 'center',
});

export const priceInput = style([baseInput, {
  flex: 1,
  textAlign: 'center',
}]);

export const priceSeparator = style({
  color: cssVarV2('text/secondary'),
  fontSize: communityTheme.fontSize.sm,
});

export const tagsSection = style({
  marginBottom: communityTheme.spacing.lg,
});

export const tagsHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: communityTheme.spacing.md,
});

export const tagsTitle = style({
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const clearTagsButton = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/secondary'),
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  
  ':hover': {
    color: cssVarV2('text/primary'),
  },
});

export const tagsContainer = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: communityTheme.spacing.sm,
  maxHeight: '120px',
  overflowY: 'auto',
  padding: communityTheme.spacing.sm,
  backgroundColor: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.sm,
});

export const tagCheckbox = style({
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.xs,
  cursor: 'pointer',
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  borderRadius: communityTheme.borderRadius.sm,
  transition: 'background-color 0.2s ease',
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
  },
});

export const tagCheckboxInput = style({
  margin: 0,
  cursor: 'pointer',
});

export const tagLabel = style({
  fontSize: communityTheme.fontSize.xs,
  fontWeight: '500',
  color: cssVarV2('pure/white'),
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  borderRadius: communityTheme.borderRadius.sm,
  transition: 'opacity 0.2s ease',
  
  selectors: {
    '[data-selected="false"] &': {
      opacity: 0.6,
    },
    '[data-selected="true"] &': {
      opacity: 1,
    },
  },
});

export const actionsRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: communityTheme.spacing.lg,
  borderTop: `1px solid ${cssVarV2('layer/border')}`,
});

export const resultCount = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});

export const actionButtons = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
});

export const resetButton = style([secondaryButton]);

export const applyButton = style([primaryButton]);

export const collapsedState = style({
  padding: communityTheme.spacing.lg,
});

export const expandButton = style([secondaryButton, {
  width: '100%',
  justifyContent: 'center',
}]);

export const sortSection = style({
  marginBottom: communityTheme.spacing.lg,
});

export const sortOptions = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
  flexWrap: 'wrap',
});

export const sortOption = style([quickFilterButton]);