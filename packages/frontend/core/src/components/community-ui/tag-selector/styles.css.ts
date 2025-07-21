import { style, keyframes } from '@vanilla-extract/css';
import { communityTheme, baseInput, baseButton, baseTag } from '../styles.css';
import { cssVarV2 } from '@toeverything/theme/v2';

const slideDown = keyframes({
  '0%': { 
    opacity: 0,
    transform: 'translateY(-10px)',
  },
  '100%': { 
    opacity: 1,
    transform: 'translateY(0)',
  },
});

export const selectorContainer = style({
  position: 'relative',
  width: '100%',
});

export const selectedTags = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: communityTheme.spacing.sm,
  marginBottom: communityTheme.spacing.md,
  minHeight: '32px',
  padding: communityTheme.spacing.sm,
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.md,
  backgroundColor: cssVarV2('layer/background/primary'),
});

export const selectedTag = style([baseTag, {
  backgroundColor: 'var(--tag-color)',
  color: cssVarV2('pure/white'),
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.xs,
  cursor: 'default',
}]);

export const removeTagButton = style({
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  padding: 0,
  fontSize: '12px',
  lineHeight: 1,
  
  ':hover': {
    opacity: 0.8,
  },
});

export const searchInput = style([baseInput, {
  marginBottom: communityTheme.spacing.sm,
}]);

export const dropdown = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: communityTheme.borderRadius.md,
  boxShadow: cssVarV2('shadow/popover'),
  zIndex: 100,
  maxHeight: '240px',
  overflowY: 'auto',
  animation: `${slideDown} 0.2s ease-out`,
});

export const dropdownContent = style({
  padding: communityTheme.spacing.sm,
});

export const createTagSection = style({
  padding: communityTheme.spacing.md,
  borderBottom: `1px solid ${cssVarV2('layer/border')}`,
  marginBottom: communityTheme.spacing.sm,
});

export const createTagButton = style([baseButton, {
  width: '100%',
  justifyContent: 'center',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  color: cssVarV2('text/primary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/secondary'),
  },
}]);

export const tagsList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const tagOption = style({
  display: 'flex',
  alignItems: 'center',
  gap: communityTheme.spacing.sm,
  padding: communityTheme.spacing.sm,
  borderRadius: communityTheme.borderRadius.sm,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
  },
  
  selectors: {
    '&[data-selected="true"]': {
      backgroundColor: `${communityTheme.colors.primary}15`,
    },
  },
});

export const tagCheckbox = style({
  margin: 0,
  cursor: 'pointer',
});

export const tagPreview = style([baseTag, {
  backgroundColor: 'var(--tag-color)',
  color: cssVarV2('pure/white'),
  cursor: 'pointer',
}]);

export const tagInfo = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const tagName = style({
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const tagUsage = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
});

export const emptyState = style({
  textAlign: 'center',
  padding: communityTheme.spacing.xl,
  color: cssVarV2('text/tertiary'),
  fontSize: communityTheme.fontSize.sm,
});

export const actions = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: communityTheme.spacing.md,
});

export const tagCount = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
});

export const clearButton = style([baseButton, {
  fontSize: communityTheme.fontSize.sm,
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.sm}`,
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
    color: cssVarV2('text/primary'),
  },
}]);

export const colorPicker = style({
  display: 'flex',
  gap: communityTheme.spacing.xs,
  marginTop: communityTheme.spacing.sm,
});

export const colorOption = style({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '2px solid transparent',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
  
  selectors: {
    '&[data-selected="true"]': {
      borderColor: cssVarV2('text/primary'),
    },
  },
});

export const customColorInput = style({
  width: '60px',
  height: '24px',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
});

export const tagCreateForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: communityTheme.spacing.sm,
  padding: communityTheme.spacing.md,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: communityTheme.borderRadius.md,
  marginBottom: communityTheme.spacing.sm,
});

export const tagNameInput = style([baseInput, {
  fontSize: communityTheme.fontSize.sm,
}]);

export const formActions = style({
  display: 'flex',
  gap: communityTheme.spacing.sm,
  justifyContent: 'flex-end',
});

export const submitButton = style([baseButton, {
  backgroundColor: communityTheme.colors.primary,
  color: cssVarV2('pure/white'),
  fontSize: communityTheme.fontSize.sm,
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.md}`,
  
  ':hover': {
    opacity: 0.8,
  },
}]);

export const cancelButton = style([baseButton, {
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  fontSize: communityTheme.fontSize.sm,
  padding: `${communityTheme.spacing.xs} ${communityTheme.spacing.md}`,
  
  ':hover': {
    backgroundColor: cssVarV2('layer/background/tertiary'),
  },
}]);