import { propertyType, t } from '@blocksuite/data-view';
import { format } from 'date-fns/format';
import zod from 'zod';

export const modifiedTimeColumnType = propertyType('modified-time');
export const modifiedTimePropertyModelConfig = modifiedTimeColumnType.modelConfig(
  {
    name: '修改时间',
    propertyData: {
      schema: zod.object({}),
      default: () => ({}),
    },
    jsonValue: {
      schema: zod.number().nullable(),
      isEmpty: () => false,
      type: () => t.date.instance(),
    },
    rawValue: {
      schema: zod.number().nullable(),
      default: () => null,
      toString: ({ value }) =>
        value != null ? format(value, 'yyyy-MM-dd HH:mm:ss') : '',
      fromString: () => {
        return { value: null };
      },
      toJson: ({ value }) => value,
      setValue: () => {},
    },
  }
);
