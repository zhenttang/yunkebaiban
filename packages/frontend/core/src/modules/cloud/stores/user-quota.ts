import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export class UserQuotaStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }
  
  async fetchUserQuota(abortSignal?: AbortSignal) {
    try {
      const res = await this.fetchService.fetch('/api/users/me/quota', {
        method: 'GET',
        signal: abortSignal,
      });
      if (!res.ok) throw new Error('获取配额失败');
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('[UserQuotaStore] 获取配额失败，使用默认值:', e);
      return { userId: undefined, quota: 0, used: 0 } as any;
    }
  }
}
