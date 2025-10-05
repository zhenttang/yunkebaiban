import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const communityContainer = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
});

export const communityContent = style({
  flex: 1,
  overflow: 'hidden',
  padding: '16px',
});

export const docListContainer = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const searchSection = style({
  marginBottom: '16px',
});

export const docGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '16px',
  flex: 1,
  overflow: 'auto',
});

export const docCard = style({
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '8px',
  padding: '16px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: cssVarV2('layer/background/primary'),
  ':hover': {
    boxShadow: cssVarV2('shadow/popover'),
    borderColor: cssVarV2('layer/border'),
  },
});

export const docCardHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px',
});

export const docTitle = style({
  fontSize: '16px',
  fontWeight: '600',
  margin: 0,
  flex: 1,
  marginRight: '8px',
  color: cssVarV2('text/primary'),
});

export const permissionBadge = style({
  fontSize: '12px',
  padding: '2px 8px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: '4px',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
});

export const docDescription = style({
  fontSize: '14px',
  color: cssVarV2('text/secondary'),
  marginBottom: '12px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  lineHeight: '1.4',
});

export const docCardFooter = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
});

export const authorInfo = style({
  fontWeight: '500',
});

export const docMeta = style({
  display: 'flex',
  gap: '8px',
});

export const emptyState = style({
  textAlign: 'center',
  padding: '40px',
  color: cssVarV2('text/tertiary'),
});

export const loadMoreSection = style({
  textAlign: 'center',
  padding: '16px',
});

export const loadMoreButton = style({
  padding: '8px 16px',
  backgroundColor: cssVarV2('button/primary'),
  color: cssVarV2('pure/white'),
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  ':disabled': {
    backgroundColor: cssVarV2('button/disable'),
    cursor: 'not-allowed',
  },
  ':hover:not(:disabled)': {
    backgroundColor: cssVarV2('button/primary'),
    opacity: 0.8,
  },
});

// 新增样式
export const header = style({
  marginBottom: '32px',
  textAlign: 'center',
});

export const title = style({
  fontSize: '32px',
  fontWeight: 'bold',
  color: cssVarV2('text/primary'),
  marginBottom: '8px',
});

export const subtitle = style({
  fontSize: '16px',
  color: cssVarV2('text/secondary'),
});

export const searchInput = style({
  width: '100%',
  maxWidth: '400px',
  padding: '12px 16px',
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/primary'),
  outline: 'none',
  
  ':focus': {
    borderColor: cssVarV2('button/primary'),
    boxShadow: `0 0 0 2px ${cssVarV2('button/primary')}33`,
  },
});

export const cardHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
});

export const viewCount = style({
  fontSize: '12px',
  color: cssVarV2('text/secondary'),
  backgroundColor: cssVarV2('layer/background/secondary'),
  padding: '4px 8px',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
});

export const cardFooter = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const authorName = style({
  fontSize: '12px',
  color: cssVarV2('text/primary'),
  fontWeight: '500',
});

export const sharedAt = style({
  fontSize: '12px',
  color: cssVarV2('text/secondary'),
});

export const actions = style({
  display: 'flex',
  gap: '8px',
});

export const viewButton = style({
  padding: '6px 12px',
  fontSize: '12px',
  backgroundColor: cssVarV2('button/primary'),
  color: cssVarV2('pure/white'),
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  
  ':hover': {
    opacity: 0.8,
  },
});

export const shareButton = style({
  padding: '6px 12px',
  fontSize: '12px',
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',

  ':hover': {
    backgroundColor: cssVarV2('layer/background/secondary'),
    color: cssVarV2('text/primary'),
  },
});

export const loadingState = style({
  textAlign: 'center',
  padding: '40px',
  color: cssVarV2('text/secondary'),
});

export const errorState = style({
  textAlign: 'center',
  padding: '40px',
  color: cssVarV2('status/error'),
});

export const statsBar = style({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  fontSize: '14px',
  color: cssVarV2('text/secondary'),
  marginBottom: '16px',
});

export const cardCover = style({
  width: '100%',
  height: '160px',
  objectFit: 'cover',
  borderRadius: '4px',
  marginBottom: '12px',
  backgroundColor: cssVarV2('layer/background/secondary'),
});

export const priceTag = style({
  fontSize: '14px',
  fontWeight: '600',
  color: cssVarV2('status/warning'),
  backgroundColor: cssVarV2('layer/background/warning'),
  padding: '4px 8px',
  borderRadius: '4px',
});

export const tagList = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '12px',
});

export const tag = style({
  fontSize: '12px',
  padding: '4px 8px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  color: cssVarV2('text/primary'),
  borderRadius: '4px',
  border: `1px solid ${cssVarV2('layer/border')}`,
});

export const cardStats = style({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
});

export const publishedAt = style({
  fontSize: '12px',
  color: cssVarV2('text/tertiary'),
});

export const likeButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  fontSize: '12px',
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',

  ':hover': {
    backgroundColor: cssVarV2('layer/background/secondary'),
    color: cssVarV2('text/primary'),
  },

  selectors: {
    '&[data-liked="true"]': {
      color: cssVarV2('status/error'),
      borderColor: cssVarV2('status/error'),
    },
  },
});

export const collectButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  fontSize: '12px',
  backgroundColor: 'transparent',
  color: cssVarV2('text/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',

  ':hover': {
    backgroundColor: cssVarV2('layer/background/secondary'),
    color: cssVarV2('text/primary'),
  },

  selectors: {
    '&[data-collected="true"]': {
      color: cssVarV2('status/warning'),
      borderColor: cssVarV2('status/warning'),
    },
  },
});

export const pagination = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  padding: '16px',
  marginTop: '16px',
});

export const pageInfo = style({
  fontSize: '14px',
  color: cssVarV2('text/secondary'),
  margin: '0 16px',
});