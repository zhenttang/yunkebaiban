import { ct } from '../../logical/composite-type.js';
import { t } from '../../logical/type-presets.js';
import { tRef, tVar } from '../../logical/type-variable.js';
import { createFilter } from './create.js';
import { tagToString } from './utils.js';

const optionName = 'options' as const;
export const tagFilter = [
  createFilter({
    name: 'isOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: tRef(optionName),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: '属于其中之一',
    shortString: v =>
      v ? `: ${tagToString(v.value, v.type.element)}` : undefined,
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return false;
      }
      return value.includes(self);
    },
    defaultValue: args => args[0][0],
  }),
  createFilter({
    name: 'isNotOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: tRef(optionName),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: '不属于其中之一',
    shortString: v =>
      v ? `: 非 ${tagToString(v.value, v.type.element)}` : undefined,
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return true;
      }
      return !value.includes(self);
    },
  }),
];
