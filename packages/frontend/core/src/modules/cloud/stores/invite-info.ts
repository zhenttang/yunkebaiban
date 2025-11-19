// import { getInviteInfoQuery } from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export class InviteInfoStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async getInviteInfo(inviteId?: string, signal?: AbortSignal) {
    if (!inviteId) {
      throw new Error('无邀请ID');
    }
    try {
      const res = await this.fetchService.fetch(`/api/invites/${inviteId}`, {
        method: 'GET',
        signal,
      });
      if (!res.ok) throw new Error('获取邀请信息失败');
      return await res.json();
    } catch (e) {
      // 维持与原逻辑一致：失败返回 undefined
      return undefined as any;
    }
  }
}
