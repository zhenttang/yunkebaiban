import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export class PublicUserStore extends Store {
  constructor(
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

    // REST 失败时返回默认的用户信息以避免应用崩溃
    const defaultUser = {
      id: id,
      name: 'Unknown User',
      email: 'unknown@example.com',
      avatarUrl: null,
    };
    return defaultUser as any;
  }
}
