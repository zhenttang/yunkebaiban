import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const promptRoot = style({
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});
export const promptTitle = style({
  fontSize: cssVar('fontH4'),
  fontWeight: '600',
  marginBottom: 48,
});
export const promptArt = style({
  marginBottom: 68,
});
export const promptWarning = style({
  backgroundColor: cssVar('backgroundTertiaryColor'),
  fontSize: cssVar('fontXs'),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 14,
  padding: 10,
  borderRadius: 8,
});
export const promptWarningTitle = style({
  color: cssVar('errorColor'),
  fontWeight: 600,
});
export const spacer = style({
  flexGrow: 1,
  minHeight: 12,
});
export const promptDisclaimer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 32,
  gap: 4,
});

export const settingsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});

export const promptDisclaimerConfirm = style({
  display: 'flex',
  justifyContent: 'center',
});
export const switchRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});
export const subHeader = style({
  fontWeight: '600',
  color: cssVar('textSecondaryColor'),
  marginBottom: 8,
});

export const rowContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
});
export const description = style({
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
  // 2 lines
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  width: '100%',
});
export const feedback = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
  gap: 8,
});

export const arrowRightIcon = style({
  marginLeft: 'auto',
  marginRight: 0,
});

export const pluginSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const pluginActionRow = style({
  display: 'flex',
  gap: 8,
});

export const pluginList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const pluginCard = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: 12,
  borderRadius: 8,
  border: `1px solid ${cssVar('borderColor')}`,
  gap: 16,
});

export const pluginBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
  minWidth: 0,
});

export const pluginInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const pluginTitle = style({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const pluginVersion = style({
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
});

export const pluginMeta = style({
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
});

export const pluginControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  alignSelf: 'flex-start',
});

export const pluginEmpty = style({
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
});

export const pluginCommandList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const pluginCommandTitle = style({
  fontSize: cssVar('fontXs'),
  fontWeight: 600,
  color: cssVar('textSecondaryColor'),
});

export const pluginCommandRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
});

export const pluginCommandLabel = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
});
