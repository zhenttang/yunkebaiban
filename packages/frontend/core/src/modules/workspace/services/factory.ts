import type { BlobStorage, DocStorage } from '@yunke/nbstore';
import type { Workspace } from '@blocksuite/yunke/store';
import { Service } from '@toeverything/infra';

import type { WorkspaceFlavoursService } from './flavours';

export class WorkspaceFactoryService extends Service {
  constructor(private readonly flavoursService: WorkspaceFlavoursService) {
    super();
  }

  /**
   * create workspace
   * @param flavour workspace flavour
   * @param initial callback to put initial data to workspace
   * @returns workspace id
   */
  create = async (
    flavour: string,
    initial: (
      docCollection: Workspace,
      blobFrontend: BlobStorage,
      docFrontend: DocStorage
    ) => Promise<void> = () => Promise.resolve()
  ) => {
    const provider = this.flavoursService.flavours$.value.find(
      x => x.flavour === flavour
    );
    if (!provider) {
      throw new Error(`未知的工作区类型：${flavour}`);
    }
    const metadata = await provider.createWorkspace(initial);
    return metadata;
  };
}
