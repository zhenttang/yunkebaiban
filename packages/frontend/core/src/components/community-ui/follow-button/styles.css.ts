import { style } from '@vanilla-extract/css';
import { communityTheme, baseButton, loadingSpinner } from '../styles.css';
import { cssVarV2 } from '@toeverything/theme/v2';

export const followButton = style([baseButton, {
  minWidth: '80px',
  justifyContent: 'center',
  fontWeight: '500',
  position: 'relative',
  
  selectors: {
    '&[data-following="false"]': {
      backgroundColor: communityTheme.colors.primary,
      color: cssVarV2('pure/white'),
      
      ':hover:not(:disabled)': {
        opacity: 0.8,
      },
    },
    '&[data-following="true"]': {
      backgroundColor: cssVarV2('layer/background/tertiary'),
      color: cssVarV2('text/primary'),
      border: `1px solid ${cssVarV2('layer/border')}`,
      
      ':hover:not(:disabled)': {
        backgroundColor: communityTheme.colors.error,
        color: cssVarV2('pure/white'),
        borderColor: communityTheme.colors.error,
      },
    },
  },
}]);

export const followButtonText = style({
  transition: 'opacity 0.2s ease',
  
  selectors: {
    '[data-loading="true"] &': {
      opacity: 0,
    },
  },
});

export const followButtonLoading = style([loadingSpinner, {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  
  selectors: {
    '[data-loading="false"] &': {
      display: 'none',
    },
  },
}]);

export const followButtonIcon = style({
  fontSize: '14px',
  transition: 'transform 0.2s ease',
  
  selectors: {
    '[data-following="true"]:hover &': {
      transform: 'scale(1.2)',
    },
  },
});

export const followerCount = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
  marginTop: communityTheme.spacing.xs,
  textAlign: 'center',
});

export const followCard = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: communityTheme.spacing.sm,
});

export const userAvatar = style({
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: cssVarV2('layer/background/tertiary'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: communityTheme.fontSize.lg,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
  overflow: 'hidden',
});

export const userInfo = style({
  textAlign: 'center',
});

export const userName = style({
  fontSize: communityTheme.fontSize.md,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
  marginBottom: communityTheme.spacing.xs,
});

export const userBio = style({
  fontSize: communityTheme.fontSize.sm,
  color: cssVarV2('text/secondary'),
  lineHeight: '1.4',
  maxWidth: '200px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const userStats = style({
  display: 'flex',
  gap: communityTheme.spacing.lg,
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
});

export const statItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
});

export const statNumber = style({
  fontSize: communityTheme.fontSize.sm,
  fontWeight: '500',
  color: cssVarV2('text/primary'),
});

export const statLabel = style({
  fontSize: communityTheme.fontSize.xs,
  color: cssVarV2('text/tertiary'),
});