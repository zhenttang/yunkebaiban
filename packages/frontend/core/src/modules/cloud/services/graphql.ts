import { UserFriendlyError } from '@affine/error';
//import {
//   gqlFetcherFactory,
//   type GraphQLQuery,
//   type QueryOptions,
//   type QueryResponse,
//} from '@affine/graphql';

// 临时占位符函数和类型，因为GraphQL后端已被移除
const gqlFetcherFactory = (endpoint: string, fetch: Function) => {
  console.warn('gqlFetcherFactory暂时禁用 - GraphQL后端已移除');
  return async (options: any) => {
    throw new Error('GraphQL操作暂时禁用 - 后端已改为Java');
  };
};

interface GraphQLQuery {
  [key: string]: any;
}

interface QueryOptions<Query> {
  query: Query;
  variables?: any;
  context?: any;
}

interface QueryResponse<Query> {
  [key: string]: any;
}

import { fromPromise, Service } from '@toeverything/infra';
import type { Observable } from 'rxjs';

import { AuthService } from './auth';
import type { FetchService } from './fetch';

export class GraphQLService extends Service {
  constructor(private readonly fetcher: FetchService) {
    super();
  }

  private readonly rawGql = gqlFetcherFactory('/graphql', this.fetcher.fetch);

  rxGql = <Query extends GraphQLQuery>(
    options: QueryOptions<Query>
  ): Observable<QueryResponse<Query>> => {
    return fromPromise(signal => {
      return this.gql({
        ...options,
        context: {
          signal,
          ...options.context,
        },
      } as any);
    });
  };

  gql = async <Query extends GraphQLQuery>(
    options: QueryOptions<Query>
  ): Promise<QueryResponse<Query>> => {
    try {
      return await this.rawGql(options);
    } catch (anyError) {
      const error = UserFriendlyError.fromAny(anyError);

      if (error.isStatus(401)) {
        this.framework.get(AuthService).session.revalidate();
      }

      throw error;
    }
  };
}
