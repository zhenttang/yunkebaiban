import {
  PreconditionStrategy,
  registerYunkeCommand,
} from '@yunke/core/commands';
import { track } from '@yunke/track';
import { useService } from '@toeverything/infra';
import { useEffect } from 'react';

import { NavigatorService } from '../services/navigator';

export function useRegisterNavigationCommands() {
  const navigator = useService(NavigatorService).navigator;
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      registerYunkeCommand({
        id: 'yunke:shortcut-history-go-back',
        category: 'yunke:general',
        preconditionStrategy: PreconditionStrategy.Never,
        icon: 'none',
        label: '后退',
        keyBinding: {
          binding: '$mod+[',
        },
        run() {
          track.$.cmdk.general.goBack();

          navigator.back();
        },
      })
    );
    unsubs.push(
      registerYunkeCommand({
        id: 'yunke:shortcut-history-go-forward',
        category: 'yunke:general',
        preconditionStrategy: PreconditionStrategy.Never,
        icon: 'none',
        label: '前进',
        keyBinding: {
          binding: '$mod+]',
        },
        run() {
          track.$.cmdk.general.goForward();

          navigator.forward();
        },
      })
    );

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [navigator]);
}
