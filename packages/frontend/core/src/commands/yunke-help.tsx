import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { ContactWithUsIcon, NewIcon } from '@blocksuite/icons/rc';

import type { WorkspaceDialogService } from '../modules/dialogs';
import type { UrlService } from '../modules/url';
import { registerYunkeCommand } from './registry';

export function registerYunkeHelpCommands({
  t,
  urlService,
  workspaceDialogService,
}: {
  t: ReturnType<typeof useI18n>;
  urlService: UrlService;
  workspaceDialogService: WorkspaceDialogService;
}) {
  const unsubs: Array<() => void> = [];
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:help-whats-new',
      category: 'yunke:help',
      icon: <NewIcon />,
      label: t['com.yunke.cmdk.yunke.whats-new'](),
      run() {
        track.$.cmdk.help.openChangelog();
        urlService.openPopupWindow(BUILD_CONFIG.changelogUrl);
      },
    })
  );
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:help-contact-us',
      category: 'yunke:help',
      icon: <ContactWithUsIcon />,
      label: t['com.yunke.cmdk.yunke.contact-us'](),
      run() {
        track.$.cmdk.help.contactUs();
        workspaceDialogService.open('setting', {
          activeTab: 'about',
        });
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
