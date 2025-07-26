// import { copilotQuotaQuery } from '@affine/graphql';
import { Store } from '@toeverything/infra';

import type { GraphQLService } from '../services/graphql';

// 临时定义 GraphQL 查询，直到 @affine/graphql 可用
const copilotQuotaQuery = `
  query getCopilotQuota {
    currentUser {
      copilot {
        quota {
          used
          limit
        }
      }
    }
  }
`;

export class UserCopilotQuotaStore extends Store {
  constructor(private readonly graphqlService: GraphQLService) {
    super();
  }

  async fetchUserCopilotQuota(abortSignal?: AbortSignal) {
    const data = await this.graphqlService.gql({
      query: copilotQuotaQuery,
      context: {
        signal: abortSignal,
      },
    });

    if (!data.currentUser) {
      throw new Error('未登录');
    }

    return data.currentUser.copilot.quota;
  }
}
