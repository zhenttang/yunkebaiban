// import { getInviteInfoQuery } from '@affine/graphql';
import { Store } from '@toeverything/infra';

import type { GraphQLService } from '../services/graphql';

export class InviteInfoStore extends Store {
  constructor(private readonly gqlService: GraphQLService) {
    super();
  }

  async getInviteInfo(inviteId?: string, signal?: AbortSignal) {
    if (!inviteId) {
      throw new Error('无邀请ID');
    }
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
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
