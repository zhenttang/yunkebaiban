import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

/**
 * 日期范围属性类型
 */
export const dateRangePropertyType = propertyType('date-range');

/**
 * 日期范围数据结构
 */
export type DateRangePropertyData = {
  /** 开始日期 (Unix 时间戳) */
  startDate: number | null;
  /** 结束日期 (Unix 时间戳) */
  endDate: number | null;
  /** 工作日配置，1=周一，7=周日 */
  workingDays?: number[];
  /** 时区 */
  timezone?: string;
  /** 是否包含结束日期 */
  includeEndDate?: boolean;
};

/**
 * JSON 值类型（用于存储）
 */
export type DateRangeJsonValue = {
  startDate: number | null;
  endDate: number | null;
  workingDays?: number[];
  timezone?: string;
  includeEndDate?: boolean;
};

/**
 * 原始值类型（用于显示和编辑）
 */
export type DateRangeRawValue = {
  startDate: number | null;
  endDate: number | null;
  workingDays?: number[];
  timezone?: string;
  includeEndDate?: boolean;
};

/**
 * 日期范围属性模型配置
 */
export const dateRangePropertyModelConfig = dateRangePropertyType.modelConfig<
  DateRangePropertyData,
  DateRangeJsonValue,
  DateRangeRawValue
>({
  name: '日期范围',
  
  // 属性数据配置
  propertyData: {
    schema: zod.object({
      /** 日期格式 */
      dateFormat: zod.string().optional().default('yyyy-MM-dd'),
      /** 是否显示时间 */
      includeTime: zod.boolean().optional().default(false),
      /** 默认时区 */
      defaultTimezone: zod.string().optional().default('Asia/Shanghai'),
    }),
    default: () => ({
      dateFormat: 'yyyy-MM-dd',
      includeTime: false,
      defaultTimezone: 'Asia/Shanghai',
    }),
  },

  // JSON 值配置（存储格式）
  jsonValue: {
    schema: zod.object({
      startDate: zod.number().nullable(),
      endDate: zod.number().nullable(),
      workingDays: zod.array(zod.number().int().min(0).max(6)).optional(),
      timezone: zod.string().optional(),
      includeEndDate: zod.boolean().optional(),
    }),
    isEmpty: (value) => !value || (!value.startDate && !value.endDate),
    type: () => t.array.instance(t.date.instance()),
  },

  // 原始值配置（显示和编辑格式）
  rawValue: {
    schema: zod.object({
      startDate: zod.number().nullable(),
      endDate: zod.number().nullable(),
      workingDays: zod.array(zod.number().int().min(0).max(6)).optional(),
      timezone: zod.string().optional(),
      includeEndDate: zod.boolean().optional(),
    }),
    
    default: () => ({
      startDate: null,
      endDate: null,
      workingDays: [1, 2, 3, 4, 5], // 默认工作日：周一到周五
      timezone: 'Asia/Shanghai',
      includeEndDate: true,
    }),

    // 转换为字符串显示
    toString: ({ value, propertyData }) => {
      if (!value || (!value.startDate && !value.endDate)) {
        return '';
      }

      const dateFormat = propertyData?.dateFormat || 'yyyy-MM-dd';
      const startStr = value.startDate ? format(value.startDate, dateFormat) : '';
      const endStr = value.endDate ? format(value.endDate, dateFormat) : '';

      if (startStr && endStr) {
        return `${startStr} ~ ${endStr}`;
      } else if (startStr) {
        return `${startStr} ~`;
      } else if (endStr) {
        return `~ ${endStr}`;
      }
      
      return '';
    },

    // 从字符串解析
    fromString: ({ value, propertyData }) => {
      if (!value || !value.trim()) {
        return { 
          value: {
            startDate: null,
            endDate: null,
            workingDays: [1, 2, 3, 4, 5],
            timezone: 'Asia/Shanghai',
            includeEndDate: true,
          }
        };
      }

      const dateFormat = propertyData?.dateFormat || 'yyyy-MM-dd';
      const parts = value.split('~').map(part => part.trim());
      
      let startDate: number | null = null;
      let endDate: number | null = null;

      try {
        if (parts[0]) {
          const start = parse(parts[0], dateFormat, new Date());
          startDate = start.getTime();
        }
        
        if (parts[1]) {
          const end = parse(parts[1], dateFormat, new Date());
          endDate = end.getTime();
        }
      } catch (error) {
        console.warn('Failed to parse date range:', error);
      }

      return {
        value: {
          startDate,
          endDate,
          workingDays: [1, 2, 3, 4, 5],
          timezone: 'Asia/Shanghai',
          includeEndDate: true,
        }
      };
    },

    // 转换为 JSON
    toJson: ({ value }) => value,

    // 从 JSON 转换
    fromJson: ({ value }) => value,
  },
});

/**
 * 工具函数：计算日期范围内的工作日
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  workingDays: number[] = [1, 2, 3, 4, 5]
): Date[] {
  const result: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    
    if (workingDays.includes(dayOfWeek)) {
      result.push(new Date(current));
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}

/**
 * 工具函数：计算两个日期之间的工作日天数
 */
export function calculateWorkingDayCount(
  startDate: Date,
  endDate: Date,
  workingDays: number[] = [1, 2, 3, 4, 5]
): number {
  return calculateWorkingDays(startDate, endDate, workingDays).length;
}

/**
 * 工具函数：检查日期是否为工作日
 */
export function isWorkingDay(date: Date, workingDays: number[] = [1, 2, 3, 4, 5]): boolean {
  return workingDays.includes(date.getDay());
}

/**
 * 工具函数：验证日期范围
 */
export function validateDateRange(value: DateRangeRawValue): { isValid: boolean; error?: string } {
  if (!value.startDate && !value.endDate) {
    return { isValid: true }; // 空值是有效的
  }

  if (value.startDate && value.endDate && value.startDate >= value.endDate) {
    return { 
      isValid: false, 
      error: '开始日期必须早于结束日期' 
    };
  }

  if (value.workingDays && value.workingDays.length === 0) {
    return { 
      isValid: false, 
      error: '至少需要设置一个工作日' 
    };
  }

  return { isValid: true };
}