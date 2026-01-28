import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const formulaPropertyType = propertyType('formula');

export const formulaPropertyModelConfig = formulaPropertyType.modelConfig({
  name: '公式',
  propertyData: {
    schema: zod.object({
      expression: zod.string().default(''),
      resultType: zod.enum(['text', 'number', 'date', 'boolean']).default('text'),
      format: zod.object({
        decimals: zod.number().optional(),
        prefix: zod.string().optional(),
        suffix: zod.string().optional(),
      }).optional(),
    }),
    default: () => ({
      expression: '',
      resultType: 'text' as const,
      format: {},
    }),
  },
  jsonValue: {
    schema: zod.union([zod.string(), zod.number(), zod.boolean()]).nullable(),
    isEmpty: value => value == null || value === '',
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: zod.union([zod.string(), zod.number(), zod.boolean()]),
    default: () => '',
    toString: ({ value }) => String(value ?? ''),
    fromString: ({ value }) => ({ value: value ?? '' }),
    toJson: ({ value }) => value ?? null,
    fromJson: ({ value }) => value ?? '',
    setValue: () => {}, // 公式字段不允许直接设置值
  },
});

// 支持的函数列表
export const FORMULA_FUNCTIONS = {
  // 数学函数
  SUM: (...args: number[]) => args.reduce((a, b) => a + b, 0),
  AVERAGE: (...args: number[]) => args.length > 0 ? args.reduce((a, b) => a + b, 0) / args.length : 0,
  MAX: (...args: number[]) => Math.max(...args),
  MIN: (...args: number[]) => Math.min(...args),
  ROUND: (num: number, decimals = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
  ABS: (num: number) => Math.abs(num),
  CEIL: (num: number) => Math.ceil(num),
  FLOOR: (num: number) => Math.floor(num),
  
  // 文本函数
  CONCAT: (...args: string[]) => args.join(''),
  LEN: (text: string) => text?.length ?? 0,
  UPPER: (text: string) => text?.toUpperCase() ?? '',
  LOWER: (text: string) => text?.toLowerCase() ?? '',
  TRIM: (text: string) => text?.trim() ?? '',
  LEFT: (text: string, count: number) => text?.slice(0, count) ?? '',
  RIGHT: (text: string, count: number) => text?.slice(-count) ?? '',
  
  // 日期函数
  NOW: () => Date.now(),
  TODAY: () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  },
  YEAR: (date: number) => new Date(date).getFullYear(),
  MONTH: (date: number) => new Date(date).getMonth() + 1,
  DAY: (date: number) => new Date(date).getDate(),
  
  // 逻辑函数
  IF: (condition: boolean, trueValue: unknown, falseValue: unknown) => condition ? trueValue : falseValue,
  AND: (...args: boolean[]) => args.every(Boolean),
  OR: (...args: boolean[]) => args.some(Boolean),
  NOT: (value: boolean) => !value,
};
