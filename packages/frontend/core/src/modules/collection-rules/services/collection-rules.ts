import { Service } from '@toeverything/infra';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
  of,
  share,
  throttleTime,
} from 'rxjs';

import { FilterProvider, GroupByProvider, OrderByProvider } from '../provider';
import type { FilterParams, GroupByParams, OrderByParams } from '../types';

export class CollectionRulesService extends Service {
  constructor() {
    super();
  }

  watch(options: {
    /**
     * 主要过滤条件
     *
     * 如果filters.length === 0，将不会匹配任何项目
     */
    filters?: FilterParams[];
    groupBy?: GroupByParams;
    orderBy?: OrderByParams;
    /**
     * 额外允许的项目列表，绕过主要过滤条件但仍受extraFilters影响
     */
    extraAllowList?: string[];
    /**
     * 在主要过滤条件和extraAllowList之后应用的额外过滤条件
     *
     * 用于应用系统级过滤，如垃圾箱、空日记等
     *
     * 注意：如果主要过滤条件没有匹配任何项目，这些extraFilters将不会被应用
     */
    extraFilters?: FilterParams[];
  }): Observable<{
    groups: {
      key: string;
      items: string[];
    }[];
    filterErrors: any[];
  }> {
    const {
      filters = [],
      groupBy,
      orderBy,
      extraAllowList,
      extraFilters = [],
    } = options;

    // 步骤1：过滤
    const filterProviders = this.framework.getAll(FilterProvider);
    const primaryFiltered$: Observable<{
      filtered: Set<string>;
      filterErrors: any[]; // 来自过滤提供者的错误
    }> =
      filters.length === 0
        ? of({
            filtered: new Set<string>([]),
            filterErrors: [],
          })
        : combineLatest(
            filters.map(filter => {
              const provider = filterProviders.get(filter.type);
              if (!provider) {
                return of({
                  error: new Error(`不支持的过滤类型: ${filter.type}`),
                });
              }
              return provider.filter$(filter).pipe(
                distinctUntilChanged((prev, curr) => {
                  return prev.isSubsetOf(curr) && curr.isSubsetOf(prev);
                }),
                catchError(error => {
                  console.log(error);
                  return of({ error });
                })
              );
            })
          ).pipe(
            map(results => {
              const aggregated = results.reduce((acc, result) => {
                if ('error' in acc) {
                  return acc;
                }
                if ('error' in result) {
                  return acc;
                }
                return acc.intersection(result);
              });

              const filtered =
                'error' in aggregated ? new Set<string>() : aggregated;

              return {
                filtered: filtered,
                filterErrors: results.map(i => ('error' in i ? i.error : null)),
              };
            })
          );

    const extraFiltered$ =
      extraFilters.length === 0
        ? of(null)
        : combineLatest(
            extraFilters.map(filter => {
              const provider = filterProviders.get(filter.type);
              if (!provider) {
                throw new Error(`不支持的过滤类型: ${filter.type}`);
              }
              return provider.filter$(filter).pipe(
                distinctUntilChanged((prev, curr) => {
                  return prev.isSubsetOf(curr) && curr.isSubsetOf(prev);
                })
              );
            })
          ).pipe(
            map(results => {
              return results.reduce((acc, result) => {
                return acc.intersection(result);
              });
            })
          );

    const finalFiltered$ = combineLatest([
      primaryFiltered$,
      extraFiltered$,
    ]).pipe(
      map(([primary, extra]) => ({
        filtered:
          extra === null
            ? primary.filtered.union(new Set(extraAllowList ?? []))
            : primary.filtered
                .union(new Set(extraAllowList ?? []))
                .intersection(extra),
        filterErrors: primary.filterErrors,
      }))
    );

    // 步骤2：排序
    const orderByProvider = orderBy
      ? this.framework.getOptional(OrderByProvider(orderBy.type))
      : null;
    const ordered$: Observable<{
      ordered: string[];
      filtered: Set<string>;
      filterErrors: any[];
    }> = finalFiltered$.pipe(last$ => {
      if (orderBy && orderByProvider) {
        const shared$ = last$.pipe(share());
        const items$ = shared$.pipe(
          map(i => i.filtered),
          // 避免对相同项目重新排序
          distinctUntilChanged((prev, curr) => {
            return prev.isSubsetOf(curr) && curr.isSubsetOf(prev);
          })
        );
        return combineLatest([
          orderByProvider.orderBy$(items$, orderBy).pipe(
            catchError(error => {
              // 当排序失败时返回空数组，通常是因为排序属性已被删除
              console.error(error);
              return of([]);
            })
          ),
          shared$,
        ]).pipe(
          map(([ordered, last]) => {
            return {
              ordered: Array.from(ordered),
              ...last,
            };
          })
        );
      }
      return last$.pipe(
        map(last => ({
          ordered: Array.from(last.filtered),
          ...last,
        }))
      );
    });

    // 步骤3：分组
    const groupByProvider = groupBy
      ? this.framework.getOptional(GroupByProvider(groupBy.type))
      : null;
    const grouped$: Observable<{
      grouped: Map<string, Set<string>>;
      ordered: string[];
      filtered: Set<string>;
      filterErrors: any[];
    }> = ordered$.pipe(last$ => {
      if (groupBy && groupByProvider) {
        const shared$ = last$.pipe(share());
        const items$ = shared$.pipe(
          map(i => i.filtered),
          // 避免对相同项目重新分组
          distinctUntilChanged((prev, curr) => {
            return prev.isSubsetOf(curr) && curr.isSubsetOf(prev);
          })
        );
        return combineLatest([
          groupByProvider.groupBy$(items$, groupBy).pipe(
            catchError(error => {
              // 当分组失败时返回空数组，通常是因为分组属性已被删除
              console.error(error);
              return of(new Map<string, Set<string>>());
            })
          ),
          shared$,
        ]).pipe(
          map(([grouped, last]) => {
            return {
              grouped: grouped,
              ...last,
            };
          })
        );
      }
      return last$.pipe(
        map(last => ({
          grouped: new Map<string, Set<string>>([['', last.filtered]]),
          ...last,
        }))
      );
    });

    // 步骤4：合并结果
    const final$: Observable<{
      groups: {
        key: string;
        items: string[];
      }[];
      filterErrors: any[];
    }> = grouped$.pipe(
      throttleTime(300, undefined, { leading: true, trailing: true }), // 节流结果以避免过多重新渲染
      map(({ grouped, ordered, filtered, filterErrors }) => {
        const result: { key: string; items: string[] }[] = [];

        function addToResult(key: string, item: string) {
          const existing = result.find(i => i.key === key);
          if (existing) {
            existing.items.push(item);
          } else {
            result.push({ key, items: [item] });
          }
        }

        // this step ensures that all filtered items are present in ordered
        const finalOrdered = new Set(ordered.concat(Array.from(filtered)));

        for (const item of finalOrdered) {
          const included = filtered.has(item);
          if (!included) {
            continue;
          }

          const groups: string[] = [];
          for (const [group, items] of grouped) {
            if (items.has(item)) {
              groups.push(group);
            }
          }

          if (groups.length === 0) {
            // ungrouped items
            addToResult('', item);
          } else {
            for (const group of groups) {
              addToResult(group, item);
            }
          }
        }

        return { groups: result, filterErrors };
      })
    );

    return final$;
  }
}
