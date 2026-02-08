import type { DocMode } from '@blocksuite/yunke/model';
import { ZipTransformer } from '@blocksuite/yunke/widgets/linked-doc';
import { Service } from '@toeverything/infra';

import { DocsService } from '../../doc';
import {
  getYUNKEWorkspaceSchema,
  type WorkspaceMetadata,
  type WorkspacesService,
} from '../../workspace';

export class ImportTemplateService extends Service {
  constructor(private readonly workspacesService: WorkspacesService) {
    super();
  }

  /**
   * H-6 修复：使用 try-finally 确保 disposeWorkspace 一定被调用
   * 
   * 旧实现在 ZipTransformer.importDocs 抛异常或 importedDoc 为空时，
   * disposeWorkspace() 不会被调用，导致工作区资源泄漏。
   */
  async importToWorkspace(
    workspaceMetadata: WorkspaceMetadata,
    docBinary: Uint8Array,
    mode: DocMode
  ) {
    const { workspace, dispose: disposeWorkspace } =
      this.workspacesService.open({
        metadata: workspaceMetadata,
      });
    try {
      await workspace.engine.doc.waitForDocReady(workspace.id);
      const [importedDoc] = await ZipTransformer.importDocs(
        workspace.docCollection,
        getYUNKEWorkspaceSchema(),
        new Blob([docBinary], {
          type: 'application/zip',
        })
      );
      if (!importedDoc) {
        throw new Error('导入文档失败');
      }
      const docsService = workspace.scope.get(DocsService);
      docsService.list.setPrimaryMode(importedDoc.id, mode);
      return importedDoc.id;
    } finally {
      disposeWorkspace();
    }
  }

  async importToNewWorkspace(
    flavour: string,
    workspaceName: string,
    docBinary: Uint8Array
    // todo: support doc mode on init
  ) {
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    let docId: string = null!;
    const { id: workspaceId } = await this.workspacesService.create(
      flavour,
      async (docCollection, _, docStorage) => {
        docCollection.meta.initialize();
        docCollection.doc.getMap('meta').set('name', workspaceName);
        const doc = docCollection.createDoc();
        docId = doc.id;
        await docStorage.pushDocUpdate({
          docId: doc.spaceDoc.guid,
          bin: docBinary,
        });
      }
    );
    return { workspaceId, docId };
  }
}
