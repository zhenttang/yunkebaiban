import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const draggedOverHighlight = style({
  selectors: {
    '&[data-dragged-over="true"]': {
      background: cssVar('--yunke-hover-color'),
      borderRadius: '4px',
    },
  },
});
