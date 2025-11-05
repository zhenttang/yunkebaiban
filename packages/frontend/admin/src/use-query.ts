import { useCallback, useMemo } from 'react';
import type { SWRConfiguration, SWRResponse } from 'swr';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRInfinite from 'swr/infinite';

import { httpClient } from '../../../common/request/src';

// REST API接口类型定义
interface RestApiQuery {
  id: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  __type?: any;
}

type QueryOptions<Query extends RestApiQuery> = {
  query: Query;
  variables?: any;
};

type QueryResponse<Query extends RestApiQuery> = Query extends { __type?: infer T } ? T : any;

// REST API获取器
const restFetcher = async (options: QueryOptions<any>) => {
  const { query, variables } = options;
  const { endpoint, method = 'GET' } = query;
  
  if (method === 'GET') {
    const params = variables ? new URLSearchParams(variables) : undefined;
    const url = params ? `${endpoint}?${params.toString()}` : endpoint;
    
    try {
      const data = await httpClient.get(url);
      // 对于空响应（如 204 No Content），返回一个标记对象表示成功
      // 这样 SWR 可以正确识别请求成功
      // 注意：axios 对于 204 响应，data 通常是空字符串或 null
      if (data === undefined || data === null || data === '') {
        return { _success: true } as any;
      }
      return data;
    } catch (error: any) {
      // 如果 httpClient.get 抛出错误，但状态码是 204，应该视为成功
      // 这种情况通常不会发生，因为 axios 会将 2xx 视为成功
      // 但为了保险起见，我们检查一下
      if (error.response?.status === 204) {
        return { _success: true };
      }
      throw error;
    }
  } else {
    return await httpClient.request(endpoint, {
      method,
      data: variables,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

type useQueryFn = <Query extends RestApiQuery>(
  options?: QueryOptions<Query>,
  config?: Omit<
    SWRConfiguration<
      QueryResponse<Query>,
      any,
      (options: QueryOptions<Query>) => Promise<QueryResponse<Query>>
    >,
    'fetcher'
  >
) => SWRResponse<
  QueryResponse<Query>,
  any,
  {
    suspense: true;
  }
>;

const createUseQuery =
  (immutable: boolean): useQueryFn =>
  (options, config) => {
    const configWithSuspense: SWRConfiguration = useMemo(
      () => ({
        suspense: true,
        ...(config || {}), // 确保 config 有默认值，避免 undefined 导致的问题
      }),
      [config]
    );

    const useSWRFn = immutable ? useSWRImmutable : useSWR;
    return useSWRFn(
      options ? ['rest-api', options.query.id, options.variables] : null,
      options ? () => restFetcher(options) : null,
      configWithSuspense
    );
  };

export const useQuery = createUseQuery(false);
export const useQueryImmutable = createUseQuery(true);

export function useQueryInfinite<Query extends RestApiQuery>(
  options: Omit<QueryOptions<Query>, 'variables'> & {
    getVariables: (
      pageIndex: number,
      previousPageData: QueryResponse<Query>
    ) => QueryOptions<Query>['variables'];
  },
  config?: Omit<
    SWRConfiguration<
      QueryResponse<Query>,
      any,
      (options: QueryOptions<Query>) => Promise<QueryResponse<Query>>
    >,
    'fetcher'
  >
) {
  const configWithSuspense: SWRConfiguration = useMemo(
    () => ({
      suspense: true,
      ...(config || {}), // 确保 config 有默认值，避免 undefined 导致的问题
    }),
    [config]
  );

  const { data, setSize, size, error } = useSWRInfinite<
    QueryResponse<Query>,
    any
  >(
    (pageIndex: number, previousPageData: QueryResponse<Query>) => [
      'rest-api',
      options.query.id,
      options.getVariables(pageIndex, previousPageData),
    ],
    async ([_, __, variables]) => {
      const params = { ...options, variables } as QueryOptions<Query>;
      return restFetcher(params);
    },
    configWithSuspense
  );

  const loadingMore = size > 0 && data && !data[size - 1];

  const loadMore = useCallback(() => {
    if (loadingMore) {
      return;
    }
    setSize(size => size + 1).catch(err => {
      console.error(err);
    });
  }, [loadingMore, setSize]);
  
  return {
    data,
    error,
    loadingMore,
    loadMore,
  };
}
