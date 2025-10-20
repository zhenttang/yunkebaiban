import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import type { DocMode } from '@blocksuite/yunke/model';
import { ImportIcon, PlusIcon } from '@blocksuite/icons/rc';

import type { usePageHelper } from '../blocksuite/block-suite-page-list/utils';
import type { GlobalDialogService } from '../modules/dialogs';
import { registerYunkeCommand } from './registry';

export function registerYunkeCreationCommands({
  pageHelper,
  t,
  globalDialogService,
}: {
  t: ReturnType<typeof useI18n>;
  pageHelper: ReturnType<typeof usePageHelper>;
  globalDialogService: GlobalDialogService;
}) {
  const unsubs: Array<() => void> = [];
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:new-page',
      category: 'yunke:creation',
      label: t['com.yunke.cmdk.yunke.new-page'](),
      icon: <PlusIcon />,
      keyBinding: BUILD_CONFIG.isElectron
        ? {
            binding: '$mod+N',
            skipRegister: true,
          }
        : undefined,
      run() {
        track.$.cmdk.creation.createDoc({ mode: 'page' });

        pageHelper.createPage('page' as DocMode);
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:new-edgeless-page',
      category: 'yunke:creation',
      icon: <PlusIcon />,
      label: t['com.yunke.cmdk.yunke.new-edgeless-page'](),
      run() {
        track.$.cmdk.creation.createDoc({
          mode: 'edgeless',
        });

        pageHelper.createEdgeless();
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:new-workspace',
      category: 'yunke:creation',
      icon: <PlusIcon />,
      label: t['com.yunke.cmdk.yunke.new-workspace'](),
      run() {
        track.$.cmdk.workspace.createWorkspace();

        globalDialogService.open('create-workspace', {});
      },
    })
  );
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:import-workspace',
      category: 'yunke:creation',
      icon: <ImportIcon />,
      label: t['com.yunke.cmdk.yunke.import-workspace'](),
      preconditionStrategy: () => {
        return BUILD_CONFIG.isElectron;
      },
      run() {
        track.$.cmdk.workspace.createWorkspace({
          control: 'import',
        });

        globalDialogService.open('import-workspace', undefined);
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
