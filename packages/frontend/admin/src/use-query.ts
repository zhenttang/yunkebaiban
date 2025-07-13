// import {
//   gqlFetcherFactory,
//   type GraphQLQuery,
//   type QueryOptions,
//   type QueryResponse,
// } from '@affine/graphql';

// Temporary type definitions to replace @affine/graphql imports
type GraphQLQuery = {
  id: string;
  operationName?: string;
  query: string;
  __type?: any;
};

type QueryOptions<Query extends GraphQLQuery> = {
  query: Query;
  variables?: any;
};

type QueryResponse<Query extends GraphQLQuery> = Query extends { __type?: infer T } ? T : any;

// Temporary gqlFetcherFactory replacement
const gqlFetcherFactory = (endpoint: string, fetchFn: typeof fetch) => {
  return async (options: QueryOptions<any>) => {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: options.query.query,
        variables: options.variables,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }
    
    return result.data;
  };
};
import type { GraphQLError } from 'graphql';
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
type useQueryFn = <Query extends GraphQLQuery>(
  options?: QueryOptions<Query>,
  config?: Omit<
    SWRConfiguration<
      QueryResponse<Query>,
      GraphQLError,
      (options: QueryOptions<Query>) => Promise<QueryResponse<Query>>
    >,
    'fetcher'
  >
) => SWRResponse<
  QueryResponse<Query>,
  GraphQLError,
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

    const useSWRFn = immutable ? useSWRImmutable : useSWR;
    return useSWRFn(
      options ? () => ['cloud', options.query.id, options.variables] : null,
      options ? () => gqlFetcher(options) : null,
      configWithSuspense
    );
  };

export const useQuery = createUseQuery(false);
export const useQueryImmutable = createUseQuery(true);

export const gqlFetcher = gqlFetcherFactory('/graphql', window.fetch);

export function useQueryInfinite<Query extends GraphQLQuery>(
  options: Omit<QueryOptions<Query>, 'variables'> & {
    getVariables: (
      pageIndex: number,
      previousPageData: QueryResponse<Query>
    ) => QueryOptions<Query>['variables'];
  },
  config?: Omit<
    SWRConfiguration<
      QueryResponse<Query>,
      GraphQLError | GraphQLError[],
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

  const { data, setSize, size, error } = useSWRInfinite<
    QueryResponse<Query>,
    GraphQLError | GraphQLError[]
  >(
    (pageIndex: number, previousPageData: QueryResponse<Query>) => [
      'cloud',
      options.query.id,
      options.getVariables(pageIndex, previousPageData),
    ],
    async ([_, __, variables]) => {
      const params = { ...options, variables } as QueryOptions<Query>;
      return gqlFetcher(params);
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
