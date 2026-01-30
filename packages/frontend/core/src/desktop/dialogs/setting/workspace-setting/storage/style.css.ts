import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

export const storageProgressContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});
export const storageProgressWrapper = style({
  flexGrow: 1,
});
globalStyle(`${storageProgressWrapper} .storage-progress-desc`, {
  fontSize: cssVar('fontXs'),
  color: cssVarV2('text/secondary'),
  height: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 2,
});
globalStyle(`${storageProgressWrapper} .storage-progress-bar-wrapper`, {
  height: '8px',
  borderRadius: '4px',
  backgroundColor: cssVarV2('layer/background/hoverOverlay'),
  overflow: 'hidden',
});
export const storageProgressBar = style({
  height: '100%',
});

export const rowTitle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
});

export const rowIcon = style({
  width: 16,
  height: 16,
  color: cssVarV2('icon/secondary'),
  flexShrink: 0,
});

export const sectionSpacing = style({
  marginTop: 12,
});

// blob management

// when no blob is selected
export const blobManagementControls = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
});

export const spacer = style({
  flexGrow: 1,
});

export const blobManagementName = style({
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  height: '28px',
});

export const blobManagementNameInactive = style([
  blobManagementName,
  {
    color: cssVarV2('text/secondary'),
  },
]);

export const blobManagementContainer = style({
  marginTop: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px',
  borderRadius: '8px',
  background: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const blobPreviewGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(30%, 1fr))',
  gap: '12px',
});

export const blobCard = style({
  borderRadius: '4px',
  overflow: 'hidden',
  position: 'relative',
  userSelect: 'none',
});

export const loadingContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '320px',
});

export const empty = style({
  paddingTop: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: cssVarV2('text/secondary'),
  fontSize: cssVar('fontSm'),
});

export const blobPreviewContainer = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
});

export const blobPreview = style({
  width: '100%',
  overflow: 'hidden',
  aspectRatio: '1',
  borderRadius: '4px',
  padding: 6,
  backgroundColor: cssVarV2('layer/background/secondary'),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: `2px solid transparent`,
  selectors: {
    [`${blobCard}[data-selected="true"] &`]: {
      borderColor: cssVarV2('button/primary'),
    },
    [`${blobCard}:hover &`]: {
      backgroundColor: cssVarV2('layer/background/hoverOverlay'),
    },
  },
});

export const blobGridItemCheckbox = style({
  position: 'absolute',
  top: 8,
  right: 8,
  fontSize: 24,
  opacity: 0,
  selectors: {
    [`${blobCard}:hover &`]: {
      opacity: 1,
    },
    [`${blobCard}[data-selected="true"] &`]: {
      opacity: 1,
    },
  },
});

globalStyle(`${blobGridItemCheckbox} path`, {
  backgroundColor: cssVarV2('layer/background/primary'),
});

export const blobImagePreview = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const unknownBlobIcon = style({});

export const blobPreviewFooter = style({
  fontSize: cssVar('fontXs'),
  width: '100%',
});

export const blobPreviewName = style({
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
});

export const blobPreviewInfo = style({
  fontSize: cssVar('fontXs'),
  color: cssVarV2('text/secondary'),
});

// 文档大小管理样式
export const docSizeName = style({
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  height: '28px',
  marginBottom: '12px',
});

export const docSizeContainer = style({
  marginTop: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px',
  borderRadius: '8px',
  background: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const docSizeLoadingContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
});

export const docSizeTable = style({
  width: '100%',
  borderCollapse: 'collapse',
});

export const docSizeTableHeader = style({
  display: 'flex',
  padding: '8px 0',
  borderBottom: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  fontWeight: 600,
  fontSize: cssVar('fontXs'),
  color: cssVarV2('text/secondary'),
});

export const docSizeTableRow = style({
  display: 'flex',
  padding: '8px 0',
  borderBottom: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  ':last-child': {
    borderBottom: 'none',
  },
});

export const docSizeTableCell = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '0 8px',
});

// 提示信息样式
export const docSizeNote = style({
  display: 'inline-block',
  marginLeft: '12px',
  fontSize: cssVar('fontXs'),
  fontWeight: 'normal',
  color: cssVarV2('text/secondary'),
  verticalAlign: 'middle',
});

// 存储路径区域样式
export const storagePathSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const storagePathDisplay = style({
  padding: '8px 12px',
  borderRadius: '6px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  fontSize: cssVar('fontXs'),
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  color: cssVarV2('text/primary'),
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const storagePathButtons = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
});

// 迁移流程步骤样式
export const migrationSteps = style({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '8px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  marginTop: '8px',
});

export const migrationStep = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: cssVar('fontXs'),
  color: cssVarV2('text/secondary'),
});

export const migrationStepNumber = style({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: cssVarV2('button/primary'),
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 600,
  flexShrink: 0,
});

export const migrationStepArrow = style({
  color: cssVarV2('icon/secondary'),
  fontSize: '14px',
});

// 外部存储配置样式
export const externalStorageSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const storageTypeSelector = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
});

export const storageTypeOption = style({
  padding: '8px 16px',
  borderRadius: '8px',
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: cssVar('fontSm'),
  transition: 'all 0.2s ease',
  selectors: {
    '&:hover': {
      backgroundColor: cssVarV2('layer/background/hoverOverlay'),
    },
    '&[data-active="true"]': {
      borderColor: cssVarV2('button/primary'),
      backgroundColor: cssVarV2('button/primary'),
      color: '#fff',
    },
  },
});

export const storageConfigForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  borderRadius: '8px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const formField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const formLabel = style({
  fontSize: cssVar('fontXs'),
  color: cssVarV2('text/secondary'),
  fontWeight: 500,
});

export const formInput = style({
  padding: '8px 12px',
  borderRadius: '6px',
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  backgroundColor: cssVarV2('layer/background/primary'),
  fontSize: cssVar('fontSm'),
  outline: 'none',
  transition: 'border-color 0.2s ease',
  ':focus': {
    borderColor: cssVarV2('button/primary'),
  },
  '::placeholder': {
    color: cssVarV2('text/placeholder'),
  },
});

export const formInputPassword = style([
  formInput,
  {
    fontFamily: 'monospace',
  },
]);

export const formActions = style({
  display: 'flex',
  gap: '8px',
  marginTop: '8px',
});

export const storageStatusBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: cssVar('fontXs'),
  fontWeight: 500,
});

export const storageStatusConnected = style([
  storageStatusBadge,
  {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: 'rgb(34, 197, 94)',
  },
]);

export const storageStatusDisconnected = style([
  storageStatusBadge,
  {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'rgb(239, 68, 68)',
  },
]);

export const storageStatusPending = style([
  storageStatusBadge,
  {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    color: 'rgb(234, 179, 8)',
  },
]);
