import type { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { SettingsIcon } from '@blocksuite/icons/rc';
import { appSettingAtom } from '@toeverything/infra';
import type { createStore } from 'jotai';
import type { useTheme } from 'next-themes';

import type { EditorSettingService } from '../modules/editor-setting';
import { registerYunkeCommand } from './registry';

export function registerYunkeSettingsCommands({
  t,
  store,
  theme,
  editorSettingService,
}: {
  t: ReturnType<typeof useI18n>;
  store: ReturnType<typeof createStore>;
  theme: ReturnType<typeof useTheme>;
  editorSettingService: EditorSettingService;
}) {
  const unsubs: Array<() => void> = [];
  const updateSettings = editorSettingService.editorSetting.set.bind(
    editorSettingService.editorSetting
  );
  const settings$ = editorSettingService.editorSetting.settings$;

  // color modes
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:change-color-mode-to-auto',
      label: `${t['com.yunke.cmdk.yunke.color-mode.to']()} ${t[
        'com.yunke.themeSettings.system'
      ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => theme.theme !== 'system',
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'theme',
          value: 'system',
        });
        theme.setTheme('system');
      },
    })
  );
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:change-color-mode-to-dark',
      label: `${t['com.yunke.cmdk.yunke.color-mode.to']()} ${t[
        'com.yunke.themeSettings.dark'
      ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => theme.theme !== 'dark',
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'theme',
          value: 'dark',
        });
        theme.setTheme('dark');
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:change-color-mode-to-light',
      label: `${t['com.yunke.cmdk.yunke.color-mode.to']()} ${t[
        'com.yunke.themeSettings.light'
      ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => theme.theme !== 'light',
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'theme',
          value: 'light',
        });

        theme.setTheme('light');
      },
    })
  );

  // Font styles
  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:change-font-style-to-sans',
      label: `${t['com.yunke.cmdk.yunke.font-style.to']()} ${t[
        'com.yunke.appearanceSettings.fontStyle.sans'
      ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => settings$.value.fontFamily !== 'Sans',
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'fontStyle',
          value: 'Sans',
        });

        updateSettings('fontFamily', 'Sans');
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:change-font-style-to-serif',
      label: `${t['com.yunke.cmdk.yunke.font-style.to']()} ${t[
        'com.yunke.appearanceSettings.fontStyle.serif'
      ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => settings$.value.fontFamily !== 'Serif',
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'fontStyle',
          value: 'Serif',
        });

        updateSettings('fontFamily', 'Serif');
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: 'yunke:change-font-style-to-mono',
      label: `${t['com.yunke.cmdk.yunke.font-style.to']()} ${t[
        'com.yunke.appearanceSettings.fontStyle.mono'
      ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => settings$.value.fontFamily !== 'Mono',
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'fontStyle',
          value: 'Mono',
        });

        updateSettings('fontFamily', 'Mono');
      },
    })
  );

  // Layout Style
  unsubs.push(
    registerYunkeCommand({
      id: `yunke:change-client-border-style`,
      label: () => `${t['com.yunke.cmdk.yunke.client-border-style.to']()} ${t[
        store.get(appSettingAtom).clientBorder
          ? 'com.yunke.cmdk.yunke.switch-state.off'
          : 'com.yunke.cmdk.yunke.switch-state.on'
      ]()}
        `,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => BUILD_CONFIG.isElectron,
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'clientBorder',
          value: store.get(appSettingAtom).clientBorder ? 'off' : 'on',
        });
        store.set(appSettingAtom, prev => ({
          ...prev,
          clientBorder: !prev.clientBorder,
        }));
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: `yunke:change-full-width-layout`,
      label: () =>
        `${t[
          settings$.value.fullWidthLayout
            ? 'com.yunke.cmdk.yunke.default-page-width-layout.standard'
            : 'com.yunke.cmdk.yunke.default-page-width-layout.full-width'
        ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'fullWidthLayout',
          value: settings$.value.fullWidthLayout ? 'off' : 'on',
        });
        updateSettings('fullWidthLayout', !settings$.value.fullWidthLayout);
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: `yunke:change-noise-background-on-the-sidebar`,
      label: () =>
        `${t[
          'com.yunke.cmdk.yunke.noise-background-on-the-sidebar.to'
        ]()} ${t[
          store.get(appSettingAtom).enableNoisyBackground
            ? 'com.yunke.cmdk.yunke.switch-state.off'
            : 'com.yunke.cmdk.yunke.switch-state.on'
        ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () => BUILD_CONFIG.isElectron,
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'enableNoisyBackground',
          value: store.get(appSettingAtom).enableNoisyBackground ? 'off' : 'on',
        });

        store.set(appSettingAtom, prev => ({
          ...prev,
          enableNoisyBackground: !prev.enableNoisyBackground,
        }));
      },
    })
  );

  unsubs.push(
    registerYunkeCommand({
      id: `yunke:change-translucent-ui-on-the-sidebar`,
      label: () =>
        `${t['com.yunke.cmdk.yunke.translucent-ui-on-the-sidebar.to']()} ${t[
          store.get(appSettingAtom).enableBlurBackground
            ? 'com.yunke.cmdk.yunke.switch-state.off'
            : 'com.yunke.cmdk.yunke.switch-state.on'
        ]()}`,
      category: 'yunke:settings',
      icon: <SettingsIcon />,
      preconditionStrategy: () =>
        BUILD_CONFIG.isElectron && environment.isMacOs,
      run() {
        track.$.cmdk.settings.changeAppSetting({
          key: 'enableBlurBackground',
          value: store.get(appSettingAtom).enableBlurBackground ? 'off' : 'on',
        });
        store.set(appSettingAtom, prev => ({
          ...prev,
          enableBlurBackground: !prev.enableBlurBackground,
        }));
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
