import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const relationPropertyType = propertyType('relation');

const relationValueSchema = zod.object({
  recordId: zod.string(),
  displayValue: zod.string(),
});

export type RelationValue = zod.infer<typeof relationValueSchema>;

export const relationPropertyModelConfig = relationPropertyType.modelConfig({
  name: '关联',
  propertyData: {
    schema: zod.object({
      targetTableId: zod.string().default(''),
      targetPropertyId: zod.string().optional(), // 双向关联时的反向属性 ID
      isTwoWay: zod.boolean().default(false),
      allowMultiple: zod.boolean().default(true),
    }),
    default: () => ({
      targetTableId: '',
      targetPropertyId: undefined,
      isTwoWay: false,
      allowMultiple: true,
    }),
  },
  jsonValue: {
    schema: zod.array(relationValueSchema).nullable(),
    isEmpty: value => !value || value.length === 0,
    type: () => t.array.instance(t.string.instance()),
  },
  rawValue: {
    schema: zod.array(relationValueSchema),
    default: () => [],
    toString: ({ value }) => value.map(v => v.displayValue).join(', '),
    fromString: () => ({ value: [] }),
    toJson: ({ value }) => (value.length > 0 ? value : null),
    fromJson: ({ value }) => value ?? [],
  },
});
