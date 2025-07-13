import { t } from '../logical/index.js';
import { createStatisticConfig } from './create.js';
import type { StatisticsConfig } from './types.js';

export const anyTypeStatsFunctions: StatisticsConfig[] = [
  createStatisticConfig({
    group: 'Count',
    menuName: '计算全部',
    displayName: '全部',
    type: 'count-all',
    dataType: t.unknown.instance(),
    impl: data => {
      return data.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: '计算值',
    displayName: '值',
    type: 'count-values',
    dataType: t.unknown.instance(),
    impl: data => {
      const values = data.reduce((acc: number, v) => {
        if (Array.isArray(v)) {
          return acc + v.length;
        }
        return acc + (v == null ? 0 : 1);
      }, 0);
      return values.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: '计算唯一值',
    displayName: '唯一值',
    type: 'count-unique-values',
    dataType: t.unknown.instance(),
    impl: data => {
      const values = data
        .flatMap(v => {
          if (Array.isArray(v)) {
            return v;
          }
          return [v];
        })
        .filter(v => v != null);
      return new Set(values).size.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: '计算空值',
    displayName: '空',
    type: 'count-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      const emptyList = data.filter(value =>
        meta.config.jsonValue.isEmpty({ value, dataSource })
      );
      return emptyList.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: '计算非空值',
    displayName: '非空',
    type: 'count-not-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      const notEmptyList = data.filter(
        value => !meta.config.jsonValue.isEmpty({ value, dataSource })
      );
      return notEmptyList.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Percent',
    menuName: '空值百分比',
    displayName: '空',
    type: 'percent-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      if (data.length === 0) return '';
      const emptyList = data.filter(value =>
        meta.config.jsonValue.isEmpty({ value, dataSource })
      );
      return ((emptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  }),
  createStatisticConfig({
    group: 'Percent',
    menuName: '非空值百分比',
    displayName: '非空',
    type: 'percent-not-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      if (data.length === 0) return '';
      const notEmptyList = data.filter(
        value => !meta.config.jsonValue.isEmpty({ value, dataSource })
      );
      return ((notEmptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  }),
];
