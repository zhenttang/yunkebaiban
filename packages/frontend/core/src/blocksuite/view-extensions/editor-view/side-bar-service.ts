import { WorkbenchService } from '@yunke/core/modules/workbench';
import { SidebarExtension } from '@blocksuite/yunke/shared/services';
import type { FrameworkProvider } from '@toeverything/infra';

export function patchSideBarService(framework: FrameworkProvider) {
  const { workbench } = framework.get(WorkbenchService);

  return SidebarExtension({
    open: (tabId?: string) => {
      workbench.openSidebar();
      workbench.activeView$.value.activeSidebarTab(tabId ?? null);
    },
    close: () => {
      workbench.closeSidebar();
    },
    getTabIds: () => {
      return workbench.activeView$.value.sidebarTabs$.value.map(tab => tab.id);
    },
  });
}
