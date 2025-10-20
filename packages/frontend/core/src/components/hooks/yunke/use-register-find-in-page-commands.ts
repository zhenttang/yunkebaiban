import {
  PreconditionStrategy,
  registerYunkeCommand,
} from '@yunke/core/commands';
import { FindInPageService } from '@yunke/core/modules/find-in-page/services/find-in-page';
import { track } from '@yunke/track';
import { useServiceOptional } from '@toeverything/infra';
import { useCallback, useEffect } from 'react';

export function useRegisterFindInPageCommands() {
  const findInPage = useServiceOptional(FindInPageService)?.findInPage;
  const showFindInPage = useCallback(() => {
    // get the selected text in page
    const selection = window.getSelection();
    const selectedText = selection?.toString();

    findInPage?.findInPage(selectedText);
  }, [findInPage]);

  useEffect(() => {
    if (!BUILD_CONFIG.isElectron) {
      return;
    }
    const unsubs: Array<() => void> = [];
    unsubs.push(
      registerYunkeCommand({
        preconditionStrategy: PreconditionStrategy.Never,
        id: `yunke:find-in-page`,
        keyBinding: {
          binding: '$mod+f',
        },
        icon: null,
        label: '',
        run() {
          track.$.cmdk.general.findInPage();
          showFindInPage();
        },
      })
    );

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [findInPage, showFindInPage]);
}
