import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const rollupPropertyType = propertyType('rollup');

// 汇总函数类型
export type RollupFunction = 
  | 'count'           // 计数
  | 'count_values'    // 计数（非空值）
  | 'count_unique'    // 唯一值计数
  | 'sum'             // 求和
  | 'average'         // 平均值
  | 'min'             // 最小值
  | 'max'             // 最大值
  | 'range'           // 范围（最大-最小）
  | 'median'          // 中位数
  | 'percent_empty'   // 空值百分比
  | 'percent_filled'  // 非空值百分比
  | 'show_original'   // 显示原始值
  | 'earliest_date'   // 最早日期
  | 'latest_date';    // 最晚日期

export const ROLLUP_FUNCTIONS: { value: RollupFunction; label: string; description: string }[] = [
  { value: 'count', label: '计数', description: '计算所有关联记录数' },
  { value: 'count_values', label: '计数（非空）', description: '计算非空值数量' },
  { value: 'count_unique', label: '唯一值计数', description: '计算唯一值数量' },
  { value: 'sum', label: '求和', description: '计算数值总和' },
  { value: 'average', label: '平均值', description: '计算数值平均值' },
  { value: 'min', label: '最小值', description: '获取最小值' },
  { value: 'max', label: '最大值', description: '获取最大值' },
  { value: 'range', label: '范围', description: '最大值减最小值' },
  { value: 'median', label: '中位数', description: '计算中位数' },
  { value: 'percent_empty', label: '空值百分比', description: '空值占比' },
  { value: 'percent_filled', label: '非空值百分比', description: '非空值占比' },
  { value: 'show_original', label: '显示原始值', description: '显示所有关联值' },
  { value: 'earliest_date', label: '最早日期', description: '获取最早日期' },
  { value: 'latest_date', label: '最晚日期', description: '获取最晚日期' },
];

export const rollupPropertyModelConfig = rollupPropertyType.modelConfig({
  name: '汇总',
  propertyData: {
    schema: zod.object({
      relationPropertyId: zod.string().default(''), // 关联字段 ID
      targetPropertyId: zod.string().default(''),   // 目标字段 ID
      rollupFunction: zod.string().default('count'), // 汇总函数
      format: zod.object({
        decimals: zod.number().optional(),
        showAsPercent: zod.boolean().optional(),
      }).optional(),
    }),
    default: () => ({
      relationPropertyId: '',
      targetPropertyId: '',
      rollupFunction: 'count',
      format: {},
    }),
  },
  jsonValue: {
    schema: zod.union([zod.string(), zod.number(), zod.array(zod.unknown())]).nullable(),
    isEmpty: value => value == null,
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: zod.union([zod.string(), zod.number(), zod.array(zod.unknown())]).nullable(),
    default: () => null,
    toString: ({ value }) => {
      if (value == null) return '';
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    },
    fromString: () => ({ value: null }),
    toJson: ({ value }) => value,
    fromJson: ({ value }) => value,
    setValue: () => {}, // 汇总字段不允许直接设置值
  },
});

/**
 * 执行汇总计算
 */
export function calculateRollup(
  values: unknown[],
  rollupFunction: RollupFunction
): string | number | unknown[] {
  if (!values || values.length === 0) {
    if (rollupFunction === 'count') return 0;
    if (rollupFunction === 'show_original') return [];
    return '';
  }

  const nonNullValues = values.filter(v => v != null && v !== '');
  const numericValues = nonNullValues
    .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
    .filter(n => !isNaN(n));

  switch (rollupFunction) {
    case 'count':
      return values.length;

    case 'count_values':
      return nonNullValues.length;

    case 'count_unique':
      return new Set(nonNullValues.map(v => String(v))).size;

    case 'sum':
      return numericValues.reduce((a, b) => a + b, 0);

    case 'average':
      if (numericValues.length === 0) return 0;
      return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

    case 'min':
      if (numericValues.length === 0) return '';
      return Math.min(...numericValues);

    case 'max':
      if (numericValues.length === 0) return '';
      return Math.max(...numericValues);

    case 'range':
      if (numericValues.length === 0) return 0;
      return Math.max(...numericValues) - Math.min(...numericValues);

    case 'median': {
      if (numericValues.length === 0) return '';
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    case 'percent_empty':
      return values.length > 0
        ? Math.round(((values.length - nonNullValues.length) / values.length) * 100)
        : 0;

    case 'percent_filled':
      return values.length > 0
        ? Math.round((nonNullValues.length / values.length) * 100)
        : 0;

    case 'show_original':
      return nonNullValues;

    case 'earliest_date': {
      const dates = nonNullValues
        .map(v => typeof v === 'number' ? v : Date.parse(String(v)))
        .filter(d => !isNaN(d));
      if (dates.length === 0) return '';
      return Math.min(...dates);
    }

    case 'latest_date': {
      const dates = nonNullValues
        .map(v => typeof v === 'number' ? v : Date.parse(String(v)))
        .filter(d => !isNaN(d));
      if (dates.length === 0) return '';
      return Math.max(...dates);
    }

    default:
      return '';
  }
}
