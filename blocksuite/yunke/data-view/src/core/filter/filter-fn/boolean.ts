import { t } from '../../logical/type-presets.js';
import { createFilter } from './create.js';

export const booleanFilter = [
  createFilter({
    name: 'isChecked',
    self: t.boolean.instance(),
    args: [],
    label: '已勾选',
    shortString: () => ': 已勾选',
    impl: value => {
      return !!value;
    },
    defaultValue: () => true,
  }),
  createFilter({
    name: 'isUnchecked',
    self: t.boolean.instance(),
    args: [],
    label: '未勾选',
    shortString: () => ': 未勾选',
    impl: value => {
      return !value;
    },
    defaultValue: () => false,
  }),
];
