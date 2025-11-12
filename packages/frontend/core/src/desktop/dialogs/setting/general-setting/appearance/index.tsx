import type { RadioItem } from '@yunke/component';
import { RadioGroup, Switch } from '@yunke/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { LanguageMenu } from '@yunke/core/components/yunke/language-menu';
import { TraySettingService } from '@yunke/core/modules/editor-setting/services/tray-settings';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';

import { useAppSettingHelper } from '../../../../../components/hooks/yunke/use-app-setting-helper';
import { OpenInAppLinksMenu } from './links';
import { settingWrapper } from './style.css';
import { ThemeEditorSetting } from './theme-editor-setting';

export const getThemeOptions = (t: ReturnType<typeof useI18n>) =>
  [
    {
      value: 'system',
      label: t['com.yunke.themeSettings.system'](),
      testId: 'system-theme-trigger',
    },
    {
      value: 'light',
      label: t['com.yunke.themeSettings.light'](),
      testId: 'light-theme-trigger',
    },
    {
      value: 'dark',
      label: t['com.yunke.themeSettings.dark'](),
      testId: 'dark-theme-trigger',
    },
  ] satisfies RadioItem[];

export const ThemeSettings = () => {
  const t = useI18n();
  const { setTheme, theme } = useTheme();

  const radioItems = useMemo<RadioItem[]>(() => getThemeOptions(t), [t]);

  return (
    <RadioGroup
      items={radioItems}
      value={theme}
      width={250}
      className={settingWrapper}
      onChange={useCallback(
        (value: string) => {
          setTheme(value);
        },
        [setTheme]
      )}
    />
  );
};

const MenubarSetting = () => {
  const t = useI18n();
  const traySettingService = useService(TraySettingService);
  const { enabled } = useLiveData(traySettingService.setting$);
  return (
    <SettingWrapper
      id="menubar"
      title={t['com.yunke.appearanceSettings.menubar.title']()}
    >
      <SettingRow
        name={t['com.yunke.appearanceSettings.menubar.toggle']()}
        desc={t['com.yunke.appearanceSettings.menubar.description']()}
      >
        <Switch
          checked={enabled}
          onChange={checked => traySettingService.setEnabled(checked)}
        />
      </SettingRow>
    </SettingWrapper>
  );
};

export const AppearanceSettings = () => {
  const t = useI18n();

  const featureFlagService = useService(FeatureFlagService);
  const enableThemeEditor = useLiveData(
    featureFlagService.flags.enable_theme_editor.$
  );
  const { appSettings, updateSettings } = useAppSettingHelper();

  return (
    <>
      <SettingHeader
        title={t['com.yunke.appearanceSettings.title']()}
        subtitle={t['com.yunke.appearanceSettings.subtitle']()}
      />

      <SettingWrapper title={t['com.yunke.appearanceSettings.theme.title']()}>
        <SettingRow
          name={t['com.yunke.appearanceSettings.color.title']()}
          desc={t['com.yunke.appearanceSettings.color.description']()}
        >
          <ThemeSettings />
        </SettingRow>
        <SettingRow
          name={t['com.yunke.appearanceSettings.language.title']()}
          desc={t['com.yunke.appearanceSettings.language.description']()}
        >
          <div className={settingWrapper}>
            <LanguageMenu />
          </div>
        </SettingRow>
        {BUILD_CONFIG.isElectron ? (
          <SettingRow
            name={t['com.yunke.appearanceSettings.clientBorder.title']()}
            desc={t['com.yunke.appearanceSettings.clientBorder.description']()}
            data-testid="client-border-style-trigger"
          >
            <Switch
              checked={appSettings.clientBorder}
              onChange={checked => updateSettings('clientBorder', checked)}
            />
          </SettingRow>
        ) : null}
        {enableThemeEditor ? <ThemeEditorSetting /> : null}
      </SettingWrapper>

      {BUILD_CONFIG.isWeb && !environment.isMobile ? (
        <SettingWrapper title={t['com.yunke.setting.appearance.links']()}>
          <SettingRow
            name={t['com.yunke.setting.appearance.open-in-app']()}
            desc={t['com.yunke.setting.appearance.open-in-app.hint']()}
            data-testid="open-in-app-links-trigger"
          >
            <OpenInAppLinksMenu />
          </SettingRow>
        </SettingWrapper>
      ) : null}

      {BUILD_CONFIG.isElectron ? (
        <SettingWrapper
          title={t['com.yunke.appearanceSettings.sidebar.title']()}
        >
          <SettingRow
            name={t['com.yunke.appearanceSettings.noisyBackground.title']()}
            desc={t[
              'com.yunke.appearanceSettings.noisyBackground.description'
            ]()}
          >
            <Switch
              checked={appSettings.enableNoisyBackground}
              onChange={checked =>
                updateSettings('enableNoisyBackground', checked)
              }
            />
          </SettingRow>
          {environment.isMacOs && (
            <SettingRow
              name={t['com.yunke.appearanceSettings.translucentUI.title']()}
              desc={t[
                'com.yunke.appearanceSettings.translucentUI.description'
              ]()}
            >
              <Switch
                checked={appSettings.enableBlurBackground}
                onChange={checked =>
                  updateSettings('enableBlurBackground', checked)
                }
              />
            </SettingRow>
          )}
        </SettingWrapper>
      ) : null}

      {BUILD_CONFIG.isElectron ? <MenubarSetting /> : null}

      <SettingWrapper title={t['com.yunke.appearanceSettings.editor.title']?.() || '编辑器'}>
        <SettingRow
          name={t['com.yunke.appearanceSettings.editor.quickToolbar.title']?.() || '快捷工具栏'}
          desc={t['com.yunke.appearanceSettings.editor.quickToolbar.description']?.() || '在编辑器顶部显示常用格式化按钮（H1、H2、列表等）'}
        >
          <Switch
            checked={appSettings.enableQuickFormatToolbar}
            onChange={checked => updateSettings('enableQuickFormatToolbar', checked)}
          />
        </SettingRow>
        <SettingRow
          name={t['com.yunke.appearanceSettings.editor.keyboardShortcuts.title']?.() || '快捷键'}
          desc={t['com.yunke.appearanceSettings.editor.keyboardShortcuts.description']?.() || '启用编辑器快捷键（Ctrl+Alt+1~3 标题，Ctrl+Shift+7/8 列表等）'}
        >
          <Switch
            checked={appSettings.enableKeyboardShortcuts}
            onChange={checked => updateSettings('enableKeyboardShortcuts', checked)}
          />
        </SettingRow>
        <SettingRow
          name={t['com.yunke.appearanceSettings.editor.commandSidebar.title']?.() || '命令侧边栏'}
          desc={t['com.yunke.appearanceSettings.editor.commandSidebar.description']?.() || '打开页面时默认显示命令侧边栏（可通过 Ctrl+Shift+/ 切换）'}
        >
          <Switch
            checked={appSettings.showBlockCommandsSidebarByDefault}
            onChange={checked => updateSettings('showBlockCommandsSidebarByDefault', checked)}
          />
        </SettingRow>
      </SettingWrapper>
    </>
  );
};
