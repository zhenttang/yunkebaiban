import { propertyType, t } from '@blocksuite/data-view';
import zod from 'zod';

export const modifiedByColumnType = propertyType('modified-by');

const userSchema = zod.object({
  userId: zod.string(),
  name: zod.string(),
  email: zod.string().optional(),
  avatar: zod.string().optional(),
});

export const modifiedByPropertyModelConfig = modifiedByColumnType.modelConfig({
  name: '修改人',
  propertyData: {
    schema: zod.object({}),
    default: () => ({}),
  },
  jsonValue: {
    schema: userSchema.nullable(),
    isEmpty: value => !value || !value.userId,
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: userSchema.nullable(),
    default: () => null,
    toString: ({ value }) => value?.name ?? '',
    fromString: () => {
      return { value: null };
    },
    toJson: ({ value }) => value,
    setValue: () => {}, // 不允许手动设置
  },
});
