import { checkboxPropertyConfig } from './checkbox/cell-renderer.js';
import { datePropertyConfig } from './date/cell-renderer.js';
import { dateRangePropertyConfig } from './date-range/cell-renderer.js';
import { emailPropertyConfig } from './email/cell-renderer.js';
import { imagePropertyConfig } from './image/cell-renderer.js';
import { multiSelectPropertyConfig } from './multi-select/cell-renderer.js';
import { numberPropertyConfig } from './number/cell-renderer.js';
import { phonePropertyConfig } from './phone/cell-renderer.js';
import { progressPropertyConfig } from './progress/cell-renderer.js';
import { ratingPropertyConfig } from './rating/cell-renderer.js';
import { selectPropertyConfig } from './select/cell-renderer.js';
import { textPropertyConfig } from './text/cell-renderer.js';
import { urlPropertyConfig } from './url/cell-renderer.js';

export * from './converts.js';
export * from './number/types.js';
export * from './select/define.js';
export * from './date-range/index.js';

export const propertyPresets = {
  checkboxPropertyConfig,
  datePropertyConfig,
  dateRangePropertyConfig,
  emailPropertyConfig,
  imagePropertyConfig,
  multiSelectPropertyConfig,
  numberPropertyConfig,
  phonePropertyConfig,
  progressPropertyConfig,
  ratingPropertyConfig,
  selectPropertyConfig,
  textPropertyConfig,
  urlPropertyConfig,
};
