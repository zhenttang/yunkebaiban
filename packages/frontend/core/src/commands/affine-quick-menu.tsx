import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { MoreHorizontalIcon } from '@blocksuite/icons/rc';
import type { Store } from 'jotai';

import { quickMenuOpenAtom } from '../components/atoms';
import { registerAffineCommand } from './registry';

export function registerAffineQuickMenuCommands({
  t,
  store,
}: {
  t: ReturnType<typeof useI18n>;
  store: Store;
}) {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    registerAffineCommand({
      id: 'affine:toggle-quick-menu',
      category: 'affine:navigation',
      icon: <MoreHorizontalIcon />,
      label: t['com.affine.cmdk.affine.quick-menu.toggle']?.() || 'Toggle Quick Menu',
      keyBinding: '$mod+Shift+M',
      run() {
        track.$.cmdk.navigation.navigate({
          to: 'quickMenu',
        });
        store.set(quickMenuOpenAtom, prev => !prev);
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
