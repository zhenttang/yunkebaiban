// import { ServerDeploymentType } from '@yunke/graphql';
import { ServerDeploymentType } from '../types';
import { Service } from '@toeverything/infra';

import type { Server } from '../entities/server';
import type { ServersService } from './servers';

export class DefaultServerService extends Service {
  readonly server: Server;

  constructor(private readonly serversService: ServersService) {
    super();

    // global server is always yunke-cloud
    const server = this.serversService.server$('yunke-cloud').value;
    if (!server) {
      throw new Error('未找到服务器');
    }
    this.server = server;
  }

  async waitForSelfhostedServerConfig() {
    if (this.server.config$.value.type === ServerDeploymentType.Selfhosted) {
      await this.server.waitForConfigRevalidation();
    }
  }
}
