import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const emailPropertyType = propertyType('email');

export const emailPropertyModelConfig = emailPropertyType.modelConfig({
  name: '邮箱',
  propertyData: {
    schema: zod.object({}),
    default: () => ({}),
  },
  jsonValue: {
    schema: zod.string().nullable(),
    isEmpty: value => !value || value.trim() === '',
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: zod.string(),
    default: () => '',
    toString: ({ value }) => value,
    fromString: ({ value }) => ({ value: value?.trim() ?? '' }),
    toJson: ({ value }) => (value ? value : null),
    fromJson: ({ value }) => value ?? '',
  },
});
