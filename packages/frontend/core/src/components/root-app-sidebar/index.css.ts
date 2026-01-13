import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

import { label as categoryDividerLabel } from '../../modules/app-sidebar/views/category-divider/index.css';

export const workspaceAndUserWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px',
  borderRadius: '10px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/outline/border')}`,
});
export const quickSearchAndNewPage = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 0',
  marginLeft: -8,
});
export const quickSearch = style({
  width: 0,
  flex: 1,
});

export const workspaceWrapper = style({
  width: 0,
  flex: 1,
});

export const bottomContainer = style({
  gap: 10,
  padding: '8px 0',
});

const sectionDividerBase = {
  height: 26,
  minHeight: 26,
  padding: '6px 8px 0',
};

export const sectionDividerTop = style({
  ...sectionDividerBase,
  marginTop: 0,
});

export const sectionDivider = style({
  ...sectionDividerBase,
  marginTop: 8,
});

globalStyle(`${sectionDividerTop} ${categoryDividerLabel}, ${sectionDivider} ${categoryDividerLabel}`, {
  fontSize: cssVar('fontSm'),
  lineHeight: '26px',
  letterSpacing: '0.02em',
});
