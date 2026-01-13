import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import type { SettingTab } from '@yunke/core/modules/dialogs/constant';
import { DocsService } from '@yunke/core/modules/doc';
import { JournalService } from '@yunke/core/modules/journal';
import { LifecycleService } from '@yunke/core/modules/lifecycle';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { apis, events } from '@yunke/electron-api';
import type { FrameworkProvider } from '@toeverything/infra';

import { setupRecordingEvents } from './recording';
import { getCurrentWorkspace } from './utils';

export function setupEvents(frameworkProvider: FrameworkProvider) {
  // 设置应用程序生命周期事件，并触发应用程序启动事件
  window.addEventListener('focus', () => {
    frameworkProvider.get(LifecycleService).applicationFocus();
  });
  frameworkProvider.get(LifecycleService).applicationStart();
  window.addEventListener('unload', () => {
    frameworkProvider
      .get(DesktopApiService)
      .api.handler.ui.pingAppLayoutReady(false)
      .catch(console.error);
  });

  events?.applicationMenu.openInSettingModal(({ activeTab, scrollAnchor }) => {
    using currentWorkspace = getCurrentWorkspace(frameworkProvider);
    if (!currentWorkspace) {
      return;
    }
    const { workspace } = currentWorkspace;
    const workspaceDialogService = workspace.scope.get(WorkspaceDialogService);
    // 先关闭所有其他对话框
    workspaceDialogService.closeAll();
    workspaceDialogService.open('setting', {
      activeTab: activeTab as unknown as SettingTab,
      scrollAnchor,
    });
  });

  events?.applicationMenu.onNewPageAction(type => {
    apis?.ui
      .isActiveTab()
      .then(isActive => {
        if (!isActive) {
          return;
        }
        using currentWorkspace = getCurrentWorkspace(frameworkProvider);
        if (!currentWorkspace) {
          return;
        }
        const { workspace } = currentWorkspace;
        const docsService = workspace.scope.get(DocsService);

        const page = docsService.createDoc({ primaryMode: type });
        workspace.scope.get(WorkbenchService).workbench.openDoc(page.id);
      })
      .catch(err => {
        console.error(err);
      });
  });

  events?.applicationMenu.onOpenJournal(() => {
    using currentWorkspace = getCurrentWorkspace(frameworkProvider);
    if (!currentWorkspace) {
      return;
    }
    const { workspace, dispose } = currentWorkspace;

    const workbench = workspace.scope.get(WorkbenchService).workbench;
    const journalService = workspace.scope.get(JournalService);
    const docId = journalService.ensureJournalByDate(new Date()).id;
    workbench.openDoc(docId);

    dispose();
  });

  setupRecordingEvents(frameworkProvider);
}
