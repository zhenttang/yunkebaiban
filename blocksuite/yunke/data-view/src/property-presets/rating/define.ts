import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const ratingPropertyType = propertyType('rating');

export const ratingPropertyModelConfig = ratingPropertyType.modelConfig({
  name: '评分',
  propertyData: {
    schema: zod.object({
      maxRating: zod.number().min(1).max(10).default(5),
      allowHalf: zod.boolean().default(false),
      color: zod.string().default('#fadb14'), // 默认金黄色
    }),
    default: () => ({
      maxRating: 5,
      allowHalf: false,
      color: '#fadb14',
    }),
  },
  jsonValue: {
    schema: zod.number().nullable(),
    isEmpty: value => value == null || value === 0,
    type: () => t.number.instance(),
  },
  rawValue: {
    schema: zod.number(),
    default: () => 0,
    toString: ({ value }) => value.toString(),
    fromString: ({ value }) => {
      const num = value ? Number(value) : NaN;
      return { value: isNaN(num) ? 0 : Math.max(0, num) };
    },
    toJson: ({ value }) => value,
    fromJson: ({ value }) => value ?? 0,
  },
});
