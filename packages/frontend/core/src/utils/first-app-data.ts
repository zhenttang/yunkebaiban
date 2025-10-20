// 以下导入用于确保块组件编辑器效果被执行
import '../blocksuite/block-suite-editor';

import { DebugLogger } from '@yunke/debug';
import { DEFAULT_WORKSPACE_NAME } from '@yunke/env/constant';
import onboardingUrl from '@yunke/templates/onboarding.zip';
import { ZipTransformer } from '@blocksuite/yunke/widgets/linked-doc';

import { DocsService } from '../modules/doc';
import { OrganizeService } from '../modules/organize';
import {
  getYUNKEWorkspaceSchema,
  type WorkspacesService,
} from '../modules/workspace';

export async function buildShowcaseWorkspace(
  workspacesService: WorkspacesService,
  flavour: string,
  workspaceName: string
) {
  const meta = await workspacesService.create(flavour, async docCollection => {
    docCollection.meta.initialize();
    docCollection.doc.getMap('meta').set('name', workspaceName);
    const blob = await (await fetch(onboardingUrl)).blob();

    await ZipTransformer.importDocs(
      docCollection,
      getYUNKEWorkspaceSchema(),
      blob
    );
  });

  const { workspace, dispose } = workspacesService.open({ metadata: meta });

  await workspace.engine.doc.waitForDocReady(workspace.id);

  const docsService = workspace.scope.get(DocsService);

  // 应该跳转到“入门指南”
  const defaultDoc = docsService.list.docs$.value.find(p =>
          p.title$.value.startsWith('入门指南')
  );
  const folderTutorialDoc = docsService.list.docs$.value.find(p =>
    p.title$.value.startsWith('How to use folder and Tags')
  );

  // 创建默认组织
  if (folderTutorialDoc) {
    const organizeService = workspace.scope.get(OrganizeService);
    const folderId = organizeService.folderTree.rootFolder.createFolder(
      '第一个文件夹',
      organizeService.folderTree.rootFolder.indexAt('after')
    );
    const firstFolderNode =
      organizeService.folderTree.folderNode$(folderId).value;
    firstFolderNode?.createLink(
      'doc',
      folderTutorialDoc.id,
      firstFolderNode.indexAt('after')
    );
  }

  dispose();

  return { meta, defaultDocId: defaultDoc?.id };
}

const logger = new DebugLogger('createFirstAppData');

export async function createFirstAppData(workspacesService: WorkspacesService) {
  if (localStorage.getItem('is-first-open') !== null) {
    return;
  }
  localStorage.setItem('is-first-open', 'false');
  const { meta, defaultDocId } = await buildShowcaseWorkspace(
    workspacesService,
    'local',
    DEFAULT_WORKSPACE_NAME
  );
  logger.info('创建首个工作区', defaultDocId);
  return { meta, defaultPageId: defaultDocId };
}
