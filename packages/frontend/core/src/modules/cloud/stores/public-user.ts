// import { getPublicUserByIdQuery } from '@affine/graphql';
import { Store } from '@toeverything/infra';

import type { GraphQLService } from '../services/graphql';
import type { FetchService } from '../services/fetch';

export class PublicUserStore extends Store {
  constructor(
    private readonly gqlService: GraphQLService,
    private readonly fetchService: FetchService
  ) {
    super();
  }

  async getPublicUserById(id: string, signal?: AbortSignal) {
    
    try {
      // 尝试使用新的 REST API
      const url = `/api/users/${id}/public`;
      
      const response = await this.fetchService.fetch(url, {
        method: 'GET',
        signal,
      });

      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else {
      }
    } catch (fetchError) {
    }

    // 如果 REST API 失败，尝试使用 GraphQL 作为后备（虽然可能也会失败）
    try {
      
      // 临时定义 GraphQL 查询（如果需要的话）
      const getPublicUserByIdQuery = `
        query getPublicUserById($id: String!) {
          publicUserById(id: $id) {
            id
            name
            email
            avatarUrl
          }
        }
      `;

      const result = await this.gqlService.gql({
        query: getPublicUserByIdQuery,
        variables: {
          id,
        },
        context: {
          signal,
        },
      });

      return result.publicUserById;
    } catch (gqlError) {
      
      // 返回默认的用户信息以避免应用崩溃
      const defaultUser = {
        id: id,
        name: 'Unknown User',
        email: 'unknown@example.com',
        avatarUrl: null,
      };
      
      return defaultUser;
    }
  }
}
