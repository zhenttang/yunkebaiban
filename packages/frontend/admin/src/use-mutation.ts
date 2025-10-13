// REST API变更操作类型定义
interface RestApiMutation {
  id: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  __type?: any;
}

type QueryResponse<Query extends RestApiMutation> = Query extends { __type?: infer T } ? T : any;

type QueryVariables<Query extends RestApiMutation> = any;

type MutationOptions<Mutation extends RestApiMutation> = {
  mutation: Mutation;
  variables?: QueryVariables<Mutation>;
};

type RecursiveMaybeFields<T> = T;

import { useMemo } from 'react';
import type { Key } from 'swr';
import { useSWRConfig } from 'swr';
import type {
  SWRMutationConfiguration,
  SWRMutationResponse,
} from 'swr/mutation';
import useSWRMutation from 'swr/mutation';

import { httpClient } from '../../../common/request/src';

// REST API mutation fetcher
const restMutationFetcher = async (options: MutationOptions<any> & { variables?: any }) => {
  const { mutation, variables } = options;
  const { endpoint, method = 'POST' } = mutation;
  
  if (method === 'GET') {
    const params = variables ? new URLSearchParams(variables) : undefined;
    const url = params ? `${endpoint}?${params.toString()}` : endpoint;
    return await httpClient.get(url);
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

/**
 * A useSWRMutation wrapper for sending REST API mutations
 */
export function useMutation<Mutation extends RestApiMutation, K extends Key = Key>(
  options: Omit<MutationOptions<Mutation>, 'variables'>,
  config?: Omit<
    SWRMutationConfiguration<
      QueryResponse<Mutation>,
      any,
      K,
      QueryVariables<Mutation>
    >,
    'fetcher'
  >
): SWRMutationResponse<
  QueryResponse<Mutation>,
  any,
  K,
  QueryVariables<Mutation>
>;
export function useMutation(
  options: Omit<MutationOptions<RestApiMutation>, 'variables'>,
  config?: any
) {
  return useSWRMutation(
    () => ['rest-api', options.mutation.id],
    (_: unknown[], { arg }: { arg: any }) =>
      restMutationFetcher({
        ...options,
        variables: arg,
      }),
    config
  );
}

// use this to revalidate all queries that match the filter
export const useMutateQueryResource = () => {
  const { mutate } = useSWRConfig();
  const revalidateResource = useMemo(
    () =>
      <Q extends RestApiMutation>(
        query: Q,
        varsFilter: (
          vars: RecursiveMaybeFields<QueryVariables<Q>>
        ) => boolean = _vars => true
      ) => {
        return mutate(key => {
          const res =
            Array.isArray(key) &&
            key[0] === 'rest-api' &&
            key[1] === query.id &&
            varsFilter(key[2]);
          if (res) {
            console.debug('revalidate resource', key);
          }
          return res;
        });
      },
    [mutate]
  );

  return revalidateResource;
};

