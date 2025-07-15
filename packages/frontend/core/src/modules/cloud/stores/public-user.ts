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
    console.log('👤 [PublicUserStore.getPublicUserById] 开始获取公开用户信息, id:', id);
    
    try {
      // 尝试使用新的 REST API
      const url = `/api/users/${id}/public`;
      console.log('👤 [PublicUserStore.getPublicUserById] 使用 REST API:', url);
      
      const response = await this.fetchService.fetch(url, {
        method: 'GET',
        signal,
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ [PublicUserStore.getPublicUserById] REST API 成功获取用户信息:', userData);
        return userData;
      } else {
        console.warn('⚠️ [PublicUserStore.getPublicUserById] REST API 响应失败:', response.status);
      }
    } catch (fetchError) {
      console.warn('⚠️ [PublicUserStore.getPublicUserById] REST API 请求失败:', fetchError);
    }

    // 如果 REST API 失败，尝试使用 GraphQL 作为后备（虽然可能也会失败）
    try {
      console.log('👤 [PublicUserStore.getPublicUserById] 尝试使用 GraphQL 后备方案');
      
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

      console.log('✅ [PublicUserStore.getPublicUserById] GraphQL 成功获取用户信息');
      return result.publicUserById;
    } catch (gqlError) {
      console.error('❌ [PublicUserStore.getPublicUserById] GraphQL 也失败了:', gqlError);
      
      // 返回默认的用户信息以避免应用崩溃
      const defaultUser = {
        id: id,
        name: 'Unknown User',
        email: 'unknown@example.com',
        avatarUrl: null,
      };
      
      console.warn('⚠️ [PublicUserStore.getPublicUserById] 使用默认用户信息:', defaultUser);
      return defaultUser;
    }
  }
}
