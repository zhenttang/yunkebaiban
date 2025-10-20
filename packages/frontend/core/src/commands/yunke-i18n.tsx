import type { I18n } from '@yunke/core/modules/i18n';
import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { SettingsIcon } from '@blocksuite/icons/rc';

import { registerYunkeCommand } from './registry';

export function registerYunkeLanguageCommands({
  i18n,
  t,
}: {
  i18n: I18n;
  t: ReturnType<typeof useI18n>;
}) {
  // Display Language
  const disposables = i18n.languageList.map(language => {
    return registerYunkeCommand({
      id: `yunke:change-display-language-to-${language.name}`,
      label: `${t['com.yunke.cmdk.yunke.display-language.to']()} ${
        language.originalName
      }`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () =>
        i18n.currentLanguage$.value.key !== language.key,
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'language',
          value: language.name,
        });

        i18n.changeLanguage(language.key);
      },
    });
  });

  return () => {
    disposables.forEach(dispose => dispose());
  };
}
