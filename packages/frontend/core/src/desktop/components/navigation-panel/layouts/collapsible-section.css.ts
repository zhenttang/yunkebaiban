import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

import { label as categoryDividerLabel } from '../../../../modules/app-sidebar/views/category-divider/index.css';

export const root = style({});
export const content = style({
  paddingTop: 8,
  paddingBottom: 4,
});

export const header = style({
  height: 26,
  minHeight: 26,
  padding: '6px 8px 0',
  selectors: {
    '&[data-dragged-over="true"]': {
      background: cssVarV2('layer/background/hoverOverlay'),
    },
  },
});

globalStyle(`${header} ${categoryDividerLabel}`, {
  fontSize: cssVar('fontSm'),
  lineHeight: '26px',
  letterSpacing: '0.02em',
});
