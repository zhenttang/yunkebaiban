import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const weekDatePicker = style({
  display: 'flex',
  alignItems: 'center',
  gap: 4,

  height: '100%',
  maxHeight: '39px',
  minWidth: 0, // 允许 flex 子项收缩
  overflow: 'hidden', // 防止溢出
});

export const weekDatePickerContent = style({
  width: 0,
  flex: 1,
  minWidth: 0, // 允许收缩
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center', // 居中显示
  gap: 4,
  userSelect: 'none',
  overflow: 'hidden', // 防止溢出
});

export const dayCell = style({
  position: 'relative',
  width: 0,
  flexGrow: 1,
  flexShrink: 1, // 允许收缩
  minWidth: 24, // 减小最小宽度
  maxWidth: 130,

  cursor: 'pointer',

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',

  padding: '2px 2px 1px 2px', // 减小内边距
  borderRadius: 4,

  fontFamily: cssVar('fontFamily'),
  fontWeight: 500,
  fontSize: 12,

  selectors: {
    '&:hover': {
      backgroundColor: cssVar('hoverColor'),
    },
    '&[data-today="true"]:not([data-active="true"])': {
      vars: {
        '--cell-color': cssVar('brandColor'),
      },
    },
    '&[data-active="true"]': {
      vars: {
        '--cell-color': cssVar('pureWhite'),
      },
      background: cssVar('brandColor'),
    },

    // interactive
    '&::before, &::after': {
      content: '',
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none',
      borderRadius: 'inherit',
      opacity: 0,
    },
    '&::before': {
      boxShadow: '0 0 0 2px var(--yunke-brand-color)',
    },
    '&::after': {
      border: '1px solid var(--yunke-brand-color)',
    },
    '&:focus-visible::before': {
      opacity: 0.5,
    },
    '&:focus-visible::after': {
      opacity: 1,
    },
  },
});
export const dayCellWeek = style({
  width: '100%',
  height: 16,
  lineHeight: '16px',
  textAlign: 'center',

  textOverflow: 'clip',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  color: 'var(--cell-color, var(--yunke-text-secondary-color))',
});
export const dayCellDate = style({
  width: '100%',
  height: 20,
  lineHeight: '20px',
  textAlign: 'center',

  color: 'var(--cell-color, var(--yunke-text-primary-color))',
});
