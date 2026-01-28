import { propertyPresets } from '@blocksuite/data-view/property-presets';

import { createdTimeColumnConfig } from './created-time/cell-renderer.js';
import { linkColumnConfig } from './link/cell-renderer.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

export * from './converts.js';
const {
  checkboxPropertyConfig,
  datePropertyConfig,
  dateRangePropertyConfig,
  emailPropertyConfig,
  multiSelectPropertyConfig,
  numberPropertyConfig,
  phonePropertyConfig,
  progressPropertyConfig,
  ratingPropertyConfig,
  selectPropertyConfig,
  urlPropertyConfig,
} = propertyPresets;
export const databaseBlockProperties = {
  checkboxColumnConfig: checkboxPropertyConfig,
  dateColumnConfig: datePropertyConfig,
  dateRangeColumnConfig: dateRangePropertyConfig,
  emailColumnConfig: emailPropertyConfig,
  multiSelectColumnConfig: multiSelectPropertyConfig,
  numberColumnConfig: numberPropertyConfig,
  phoneColumnConfig: phonePropertyConfig,
  progressColumnConfig: progressPropertyConfig,
  ratingColumnConfig: ratingPropertyConfig,
  selectColumnConfig: selectPropertyConfig,
  urlColumnConfig: urlPropertyConfig,
  imageColumnConfig: propertyPresets.imagePropertyConfig,
  linkColumnConfig,
  richTextColumnConfig,
  titleColumnConfig,
  createdTimeColumnConfig,
};
