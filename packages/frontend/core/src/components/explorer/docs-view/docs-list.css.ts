import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const groupHeader = style({
  background: 'transparent',
});

export const docItem = style({
  transition: 'width 0.2s ease-in-out',
});

// 🔥 Bug修复：空状态UI样式
export const emptyState = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  color: cssVarV2.text.secondary,
  fontSize: '14px',
  textAlign: 'center',
  padding: '24px',
});

export const emptyStateTitle = style({
  marginBottom: '12px',
  fontSize: '16px',
  fontWeight: 500,
});