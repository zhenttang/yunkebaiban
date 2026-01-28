import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const attachmentPropertyType = propertyType('attachment');

const attachmentItemSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  size: zod.number(),
  type: zod.string(),
  url: zod.string(),
  thumbnailUrl: zod.string().optional(),
  uploadedAt: zod.number(),
});

export type AttachmentItem = zod.infer<typeof attachmentItemSchema>;

export const attachmentPropertyModelConfig = attachmentPropertyType.modelConfig({
  name: '附件',
  propertyData: {
    schema: zod.object({
      maxSize: zod.number().default(10 * 1024 * 1024), // 默认 10MB
      allowedTypes: zod.array(zod.string()).default([]), // 空数组表示允许所有类型
    }),
    default: () => ({
      maxSize: 10 * 1024 * 1024,
      allowedTypes: [],
    }),
  },
  jsonValue: {
    schema: zod.array(attachmentItemSchema).nullable(),
    isEmpty: value => !value || value.length === 0,
    type: () => t.array.instance(t.string.instance()),
  },
  rawValue: {
    schema: zod.array(attachmentItemSchema),
    default: () => [],
    toString: ({ value }) => value.map(v => v.name).join(', '),
    fromString: () => ({ value: [] }),
    toJson: ({ value }) => (value.length > 0 ? value : null),
    fromJson: ({ value }) => value ?? [],
  },
});
