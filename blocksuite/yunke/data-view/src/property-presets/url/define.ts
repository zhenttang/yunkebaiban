import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const urlPropertyType = propertyType('url');

export const urlPropertyModelConfig = urlPropertyType.modelConfig({
  name: 'URL',
  propertyData: {
    schema: zod.object({
      showTitle: zod.boolean().default(false), // 是否显示页面标题
    }),
    default: () => ({
      showTitle: false,
    }),
  },
  jsonValue: {
    schema: zod
      .object({
        url: zod.string(),
        title: zod.string().optional(),
      })
      .nullable(),
    isEmpty: value => !value || !value.url,
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: zod.object({
      url: zod.string(),
      title: zod.string().optional(),
    }),
    default: () => ({ url: '', title: '' }),
    toString: ({ value }) => value.url || '',
    fromString: ({ value }) => {
      // 简单的 URL 解析
      const url = value?.trim() || '';
      return { value: { url, title: '' } };
    },
    toJson: ({ value }) => (value.url ? value : null),
    fromJson: ({ value }) => value ?? { url: '', title: '' },
  },
});
