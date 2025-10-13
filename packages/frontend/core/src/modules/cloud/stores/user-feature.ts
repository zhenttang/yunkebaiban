import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export class UserFeatureStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async getUserFeatures(signal: AbortSignal) {
    try {
      const res = await this.fetchService.fetch('/api/users/me/features', {
        method: 'GET',
        signal,
      });
      if (!res.ok) throw new Error('获取用户功能失败');
      return await res.json();
    } catch (e) {
      console.warn('[UserFeatureStore] 获取用户功能失败，返回默认空集合');
      return { userId: undefined, features: [] } as any;
    }
  }
}
