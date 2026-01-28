import { propertyPresets } from '@blocksuite/data-view/property-presets';

import { createdTimeColumnConfig } from './created-time/cell-renderer.js';
import { linkColumnConfig } from './link/cell-renderer.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

export * from './converts.js';
const {
  checkboxPropertyConfig,
  datePropertyConfig,
  dateRangePropertyConfig, // 🆕 添加日期范围属性
  multiSelectPropertyConfig,
  numberPropertyConfig,
  progressPropertyConfig,
  ratingPropertyConfig, // 🆕 添加评分属性
  selectPropertyConfig,
  urlPropertyConfig, // 🆕 添加 URL 属性
} = propertyPresets;
export const databaseBlockProperties = {
  checkboxColumnConfig: checkboxPropertyConfig,
  dateColumnConfig: datePropertyConfig,
  dateRangeColumnConfig: dateRangePropertyConfig, // 🆕 添加日期范围属性配置
  multiSelectColumnConfig: multiSelectPropertyConfig,
  numberColumnConfig: numberPropertyConfig,
  progressColumnConfig: progressPropertyConfig,
  ratingColumnConfig: ratingPropertyConfig, // 🆕 添加评分属性配置
  selectColumnConfig: selectPropertyConfig,
  urlColumnConfig: urlPropertyConfig, // 🆕 添加 URL 属性配置
  imageColumnConfig: propertyPresets.imagePropertyConfig,
  linkColumnConfig,
  richTextColumnConfig,
  titleColumnConfig,
  createdTimeColumnConfig,
};
