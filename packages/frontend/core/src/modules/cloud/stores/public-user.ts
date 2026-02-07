import { DebugLogger } from '@affine/debug';
import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

const logger = new DebugLogger('public-user-store');

interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export class PublicUserStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async getPublicUserById(
    id: string,
    signal?: AbortSignal
  ): Promise<PublicUser> {
    try {
      const url = `/api/users/${id}/public`;

      const response = await this.fetchService.fetch(url, {
        method: 'GET',
        signal,
      });

      if (response.ok) {
        const userData = await response.json();
        return userData as PublicUser;
      } else {
        logger.warn(
          `Failed to fetch public user ${id}: HTTP ${response.status}`
        );
      }
    } catch (fetchError) {
      logger.debug(`Failed to fetch public user ${id}:`, fetchError);
    }

    // REST 失败时返回默认的用户信息以避免应用崩溃
    return {
      id,
      name: 'Unknown User',
      email: 'unknown@example.com',
      avatarUrl: null,
    };
  }
}
