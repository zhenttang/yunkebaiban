import { ct } from '../../logical/composite-type.js';
import { t } from '../../logical/type-presets.js';
import { tRef, tVar } from '../../logical/type-variable.js';
import { createFilter } from './create.js';
import { tagToString } from './utils.js';

const optionName = 'option' as const;
export const multiTagFilter = [
  createFilter({
    name: 'containsOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: '包含其中之一',
    shortString: v =>
      v ? `: ${tagToString(v.value, v.type.element)}` : undefined,
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return false;
      }
      return value.some(v => self.includes(v));
    },
    defaultValue: args => {
      const value = args[0][0];
      if (value != null) {
        return [value];
      }
      return;
    },
  }),
  createFilter({
    name: 'doesNotContainOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: '不包含其中之一',
    shortString: v =>
      v ? `: 非 ${tagToString(v.value, v.type.element)}` : undefined,
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return true;
      }
      return value.every(v => !self.includes(v));
    },
  }),
  createFilter({
    name: 'containsAll',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: '包含全部',
    shortString: v =>
      v ? `: ${tagToString(v.value, v.type.element)}` : undefined,
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return false;
      }
      return value.every(v => self.includes(v));
    },
    defaultValue: args => args[0],
  }),
  createFilter({
    name: 'doesNotContainAll',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: '不包含全部',
    shortString: v =>
      v ? `: 非 ${tagToString(v.value, v.type.element)}` : undefined,
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return true;
      }
      return !value.every(v => self.includes(v));
    },
  }),
];
