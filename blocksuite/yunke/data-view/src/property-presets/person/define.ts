import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const personPropertyType = propertyType('person');

const personValueSchema = zod.object({
  userId: zod.string(),
  name: zod.string(),
  email: zod.string().optional(),
  avatar: zod.string().optional(),
});

export type PersonValue = zod.infer<typeof personValueSchema>;

export const personPropertyModelConfig = personPropertyType.modelConfig({
  name: '人员',
  propertyData: {
    schema: zod.object({
      allowMultiple: zod.boolean().default(false),
      notifyOnAssign: zod.boolean().default(false),
    }),
    default: () => ({
      allowMultiple: false,
      notifyOnAssign: false,
    }),
  },
  jsonValue: {
    schema: zod.union([
      personValueSchema,
      zod.array(personValueSchema),
    ]).nullable(),
    isEmpty: value => {
      if (!value) return true;
      if (Array.isArray(value)) return value.length === 0;
      return !value.userId;
    },
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: zod.union([
      personValueSchema,
      zod.array(personValueSchema),
    ]).nullable(),
    default: () => null,
    toString: ({ value }) => {
      if (!value) return '';
      if (Array.isArray(value)) {
        return value.map(v => v.name).join(', ');
      }
      return value.name;
    },
    fromString: () => ({ value: null }),
    toJson: ({ value }) => value,
    fromJson: ({ value }) => value,
  },
});
