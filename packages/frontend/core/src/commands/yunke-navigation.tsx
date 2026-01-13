import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import type { Workspace } from '@blocksuite/yunke/store';
import { ArrowRightBigIcon } from '@blocksuite/icons/rc';

import type { useNavigateHelper } from '../components/hooks/use-navigate-helper';
import type { WorkspaceDialogService } from '../modules/dialogs';
import type { WorkbenchService } from '../modules/workbench';
import { registerYunkeCommand } from './registry';

export function registerYunkeNavigationCommands({
  t,
  docCollection,
  navigationHelper,
  workspaceDialogService,
  workbenchService,
}: {
  t: ReturnType<typeof useI18n>;
  navigationHelper: ReturnType<typeof useNavigateHelper>;
  docCollection: Workspace;
  workspaceDialogService: WorkspaceDialogService;
  workbenchService?: WorkbenchService;
}) {
  const unsubs: Array<() => void> = [];
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:goto-all-pages',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: t['com.yunke.cmdk.yunke.navigation.goto-all-pages'](),
      run() {
        track.$.cmdk.navigation.navigate({
          to: 'allDocs',
        });

        navigationHelper.jumpToPage(docCollection.id, 'all');
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:goto-collection-list',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: 'Go to Collection List',
      run() {
        track.$.cmdk.navigation.navigate({
          to: 'collectionList',
        });

        navigationHelper.jumpToCollections(docCollection.id);
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:goto-tag-list',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: 'Go to Tag List',
      run() {
        track.$.cmdk.navigation.navigate({
          to: 'tagList',
        });

        navigationHelper.jumpToTags(docCollection.id);
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:goto-workspace',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: t['com.yunke.cmdk.yunke.navigation.goto-workspace'](),
      run() {
        track.$.cmdk.navigation.navigate({
          to: 'workspace',
        });

        workbenchService?.workbench.openWorkspaceSelector();
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:open-settings',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: t['com.yunke.cmdk.yunke.navigation.open-settings'](),
      keyBinding: '$mod+,',
      run() {
        track.$.cmdk.settings.openSettings();
        workspaceDialogService.open('setting', {
          activeTab: 'appearance',
        });
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:open-account',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: t['com.yunke.cmdk.yunke.navigation.open-account-settings'](),
      run() {
        track.$.cmdk.settings.openSettings({ to: 'account' });
        workspaceDialogService.open('setting', {
          activeTab: 'account',
        });
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:goto-trash',
      category: 'yunke:navigation',
      icon: <ArrowRightBigIcon />,
      label: t['com.yunke.cmdk.yunke.navigation.goto-trash'](),
      run() {
        track.$.cmdk.navigation.navigate({
          to: 'trash',
        });

        navigationHelper.jumpToPage(docCollection.id, 'trash');
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
