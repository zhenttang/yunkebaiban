import { t } from '../../logical/type-presets.js';
import { createFilter } from './create.js';

export const unknownFilter = [
  createFilter({
    name: 'isNotEmpty',
    self: t.unknown.instance(),
    args: [] as const,
    label: '不为空',
    shortString: () => ': 不为空',
    impl: self => {
      if (Array.isArray(self)) {
        return self.length > 0;
      }
      if (typeof self === 'string') {
        return !!self;
      }
      return self != null;
    },
  }),
  createFilter({
    name: 'isEmpty',
    self: t.unknown.instance(),
    args: [] as const,
    label: '为空',
    shortString: () => ': 为空',
    impl: self => {
      if (Array.isArray(self)) {
        return self.length === 0;
      }
      if (typeof self === 'string') {
        return !self;
      }
      return self == null;
    },
  }),
];
