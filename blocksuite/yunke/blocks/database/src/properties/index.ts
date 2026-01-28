import { propertyPresets } from '@blocksuite/data-view/property-presets';

import { createdByColumnConfig } from './created-by/cell-renderer.js';
import { createdTimeColumnConfig } from './created-time/cell-renderer.js';
import { linkColumnConfig } from './link/cell-renderer.js';
import { modifiedByColumnConfig } from './modified-by/cell-renderer.js';
import { modifiedTimeColumnConfig } from './modified-time/cell-renderer.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

export * from './converts.js';
const {
  attachmentPropertyConfig,
  checkboxPropertyConfig,
  datePropertyConfig,
  dateRangePropertyConfig,
  emailPropertyConfig,
  formulaPropertyConfig,
  multiSelectPropertyConfig,
  numberPropertyConfig,
  personPropertyConfig,
  phonePropertyConfig,
  progressPropertyConfig,
  ratingPropertyConfig,
  relationPropertyConfig,
  selectPropertyConfig,
  urlPropertyConfig,
} = propertyPresets;
export const databaseBlockProperties = {
  attachmentColumnConfig: attachmentPropertyConfig,
  checkboxColumnConfig: checkboxPropertyConfig,
  dateColumnConfig: datePropertyConfig,
  dateRangeColumnConfig: dateRangePropertyConfig,
  emailColumnConfig: emailPropertyConfig,
  formulaColumnConfig: formulaPropertyConfig,
  multiSelectColumnConfig: multiSelectPropertyConfig,
  numberColumnConfig: numberPropertyConfig,
  personColumnConfig: personPropertyConfig,
  phoneColumnConfig: phonePropertyConfig,
  progressColumnConfig: progressPropertyConfig,
  ratingColumnConfig: ratingPropertyConfig,
  relationColumnConfig: relationPropertyConfig,
  selectColumnConfig: selectPropertyConfig,
  urlColumnConfig: urlPropertyConfig,
  imageColumnConfig: propertyPresets.imagePropertyConfig,
  linkColumnConfig,
  richTextColumnConfig,
  titleColumnConfig,
  // 系统字段
  createdTimeColumnConfig,
  modifiedTimeColumnConfig,
  createdByColumnConfig,
  modifiedByColumnConfig,
};
