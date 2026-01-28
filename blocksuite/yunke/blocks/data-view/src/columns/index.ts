import { richTextColumnConfig } from '@blocksuite/yunke-block-database';
import type { PropertyMetaConfig } from '@blocksuite/data-view';
import { propertyPresets } from '@blocksuite/data-view/property-presets';

export const queryBlockColumns = [
  propertyPresets.datePropertyConfig,
  propertyPresets.dateRangePropertyConfig,
  propertyPresets.numberPropertyConfig,
  propertyPresets.progressPropertyConfig,
  propertyPresets.ratingPropertyConfig,
  propertyPresets.urlPropertyConfig,
  propertyPresets.phonePropertyConfig,
  propertyPresets.emailPropertyConfig,
  propertyPresets.attachmentPropertyConfig,
  propertyPresets.formulaPropertyConfig,
  propertyPresets.personPropertyConfig,
  propertyPresets.relationPropertyConfig,
  propertyPresets.rollupPropertyConfig,
  propertyPresets.selectPropertyConfig,
  propertyPresets.multiSelectPropertyConfig,
  propertyPresets.checkboxPropertyConfig,
];
export const queryBlockHiddenColumns: PropertyMetaConfig<
  string,
  any,
  any,
  any
>[] = [richTextColumnConfig];
const queryBlockAllColumns = [...queryBlockColumns, ...queryBlockHiddenColumns];
export const queryBlockAllColumnMap = Object.fromEntries(
  queryBlockAllColumns.map(v => [v.type, v as PropertyMetaConfig])
);
