import { FetchService } from '@affine/core/modules/cloud';
import { useService } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';
import type { SWRConfiguration, SWRResponse } from 'swr';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRInfinite from 'swr/infinite';

/**
 * A `useSWR` wrapper for sending graphql queries
 *
 * @example
 *
 * ```ts
 * import { someQuery, someQueryWithNoVars } from '@affine/graphql'
 *
 * const swrResponse1 = useQuery({
 *   query: workspaceByIdQuery,
 *   variables: { id: '1' }
 * })
 *
 * const swrResponse2 = useQuery({
 *   query: someQueryWithNoVars
 * })
 * ```
 */
interface RestApiQuery {
  id: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

type QueryOptions<Query extends RestApiQuery> = {
  query: Query;
  variables?: any;
};

type QueryResponse<Query extends RestApiQuery> = any;

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
        ...config,
      }),
      [config]
    );
    const fetchService = useService(FetchService);

    const useSWRFn = immutable ? useSWRImmutable : useSWR;
    return useSWRFn(
      options ? () => ['rest-api', options.query.id, options.variables] : null,
      options
        ? async () => {
            const { endpoint, method = 'GET' } = options.query;
            if (method === 'GET') {
              const params = options.variables
                ? new URLSearchParams(options.variables).toString()
                : '';
              const url = params ? `${endpoint}?${params}` : endpoint;
              const res = await fetchService.fetch(url);
              return await res.json();
            } else {
              const res = await fetchService.fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options.variables ?? {}),
              });
              return await res.json();
            }
          }
        : null,
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
      ...config,
    }),
    [config]
  );
  const fetchService = useService(FetchService);

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
      const { endpoint, method = 'GET' } = params.query;
      if (method === 'GET') {
        const qs = new URLSearchParams(variables as any).toString();
        const url = qs ? `${endpoint}?${qs}` : endpoint;
        const res = await fetchService.fetch(url);
        return await res.json();
      } else {
        const res = await fetchService.fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variables ?? {}),
        });
        return await res.json();
      }
    },
    configWithSuspense
  );

  const loadingMore = size > 0 && data && !data[size - 1];

  // TODO(@Peng): find a generic way to know whether or not there are more items to load
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
