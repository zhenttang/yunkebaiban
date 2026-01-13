import { notify } from '@yunke/component';
import { updateReadyAtom } from '@yunke/core/components/hooks/use-app-updater';
import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { ResetIcon } from '@blocksuite/icons/rc';
import type { createStore } from 'jotai';

import { registerYunkeCommand } from './registry';

export function registerYunkeUpdatesCommands({
  t,
  store,
  quitAndInstall,
}: {
  t: ReturnType<typeof useI18n>;
  store: ReturnType<typeof createStore>;
  quitAndInstall: () => Promise<void>;
}) {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:restart-to-upgrade',
      category: 'yunke:updates',
      icon: <ResetIcon />,
      label: t['com.yunke.cmdk.yunke.restart-to-upgrade'](),
      preconditionStrategy: () => !!store.get(updateReadyAtom),
      run() {
        track.$.cmdk.updates.quitAndInstall();

        quitAndInstall().catch(err => {
          notify.error({
            title: '重启升级失败',
            message: '请手动重启应用以升级。',
          });
          console.error(err);
        });
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
