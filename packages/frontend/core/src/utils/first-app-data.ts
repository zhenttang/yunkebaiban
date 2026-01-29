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

/**
 * 创建首个应用数据（本地工作区）
 * 
 * 🔧 逻辑说明：
 * - 首次打开：创建本地工作区
 * - 非首次但无工作区：也应创建（由 index.tsx 处理）
 * - 这符合"默认离线模式"的设计原则
 * 
 * @param workspacesService 工作区服务
 * @param force 是否强制创建（忽略 is-first-open 标记）
 */
export async function createFirstAppData(
  workspacesService: WorkspacesService,
  force = false
) {
  // 检查是否需要创建
  const isFirstOpen = localStorage.getItem('is-first-open') === null;
  
  if (!isFirstOpen && !force) {
    logger.info('非首次打开且未强制创建，跳过');
    return;
  }
  
  // 标记已打开过
  localStorage.setItem('is-first-open', 'false');
  
  logger.info('开始创建首个本地工作区...', { isFirstOpen, force });
  
  const { meta, defaultDocId } = await buildShowcaseWorkspace(
    workspacesService,
    'local',
    DEFAULT_WORKSPACE_NAME
  );
  
  logger.info('首个工作区创建成功', { id: meta.id, defaultDocId });
  return { meta, defaultPageId: defaultDocId };
}
