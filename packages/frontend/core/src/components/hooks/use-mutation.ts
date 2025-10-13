import { FetchService } from '@affine/core/modules/cloud';
import { useService } from '@toeverything/infra';
import { useMemo } from 'react';
import type { Key } from 'swr';
import { useSWRConfig } from 'swr';
import type {
  SWRMutationConfiguration,
  SWRMutationResponse,
} from 'swr/mutation';
import useSWRMutation from 'swr/mutation';

interface RestApiMutation {
  id: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

type MutationOptions<Mutation extends RestApiMutation> = {
  mutation: Mutation;
  variables?: any;
};

type QueryResponse<Mutation extends RestApiMutation> = any;
type QueryVariables<Mutation extends RestApiMutation> = any;

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
  const fetchService = useService(FetchService);
  return useSWRMutation(
    () => ['rest-api', options.mutation.id],
    async (_: unknown[], { arg }: { arg: any }) => {
      const { endpoint, method = 'POST' } = options.mutation;
      if (method === 'GET') {
        const qs = arg ? new URLSearchParams(arg).toString() : '';
        const url = qs ? `${endpoint}?${qs}` : endpoint;
        const res = await fetchService.fetch(url);
        return await res.json();
      } else {
        const res = await fetchService.fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(arg ?? {}),
        });
        return await res.json();
      }
    },
    config
  );
}

export const useMutateQueryResource = () => {
  const { mutate } = useSWRConfig();
  const revalidateResource = useMemo(
    () =>
      <Q extends RestApiMutation>(
        query: Q,
        varsFilter: (vars: QueryVariables<Q>) => boolean = _vars => true
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

