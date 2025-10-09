// import { acceptInviteByInviteIdMutation } from '@affine/graphql';
import { Store } from '@toeverything/infra';

import type { GraphQLService } from '../services/graphql';

export class AcceptInviteStore extends Store {
  constructor(private readonly gqlService: GraphQLService) {
    super();
  }

  async acceptInvite(
    workspaceId: string,
    inviteId: string,
    signal?: AbortSignal
  ) {
    const res = await fetch(`/api/invites/${inviteId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
      signal,
    });
    if (!res.ok) throw new Error('接受邀请失败');
    const data = await res.json();
    return data?.success ?? true;
  }
}
