//import {
//   gqlFetcherFactory,
//   type OauthProvidersQuery,
//   oauthProvidersQuery,
//   type ServerConfigQuery,
//   serverConfigQuery,
//   ServerFeature,
//} from '@affine/graphql';

// Temporary placeholder types and functions since GraphQL backend removed
enum ServerFeature {
  Captcha = 'captcha',
  Copilot = 'copilot',
  OAuth = 'oauth',
  Payment = 'payment',
}

const gqlFetcherFactory = (url: string, fetch: Function) => {
  console.warn('gqlFetcherFactory暂时禁用 - GraphQL后端已移除');
  return () => Promise.reject(new Error('GraphQL暂时禁用'));
};

const serverConfigQuery = null;
const oauthProvidersQuery = null;

interface ServerConfigQuery {
  serverConfig: any;
}

interface OauthProvidersQuery {
  serverConfig: any;
}

import { Store } from '@toeverything/infra';

export type ServerConfigType = ServerConfigQuery['serverConfig'] &
  OauthProvidersQuery['serverConfig'];

export class ServerConfigStore extends Store {
  constructor() {
    super();
  }

  async fetchServerConfig(
    serverBaseUrl: string,
    abortSignal?: AbortSignal
  ): Promise<ServerConfigType> {
    const gql = gqlFetcherFactory(`${serverBaseUrl}/graphql`, globalThis.fetch);
    const serverConfigData = await gql({
      query: serverConfigQuery,
      context: {
        signal: abortSignal,
      },
    });
    if (serverConfigData.serverConfig.features.includes(ServerFeature.OAuth)) {
      const oauthProvidersData = await gql({
        query: oauthProvidersQuery,
        context: {
          signal: abortSignal,
        },
      });
      return {
        ...serverConfigData.serverConfig,
        ...oauthProvidersData.serverConfig,
      };
    }
    return { ...serverConfigData.serverConfig, oauthProviders: [] };
  }
}
