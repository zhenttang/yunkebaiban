import { Button, Checkbox, Loading, Switch, Tooltip, notify } from '@yunke/component';
import { SettingHeader } from '@yunke/component/setting-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import {
  YUNKE_FLAGS,
  FeatureFlagService,
  type Flag,
} from '@yunke/core/modules/feature-flag';
import { PluginRuntimeService, PluginService } from '@yunke/core/modules/plugins';
import { useI18n } from '@yunke/i18n';
import {
  ArrowRightSmallIcon,
  DiscordIcon,
  EmailIcon,
  GithubIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useServices } from '@toeverything/infra';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Suspense, useCallback, useState } from 'react';

import { ExperimentalFeatureArts } from './arts';
import * as styles from './index.css';

const ExperimentalFeaturesPrompt = ({
  onConfirm,
}: {
  onConfirm: () => void;
}) => {
  const t = useI18n();
  const [checked, setChecked] = useState(false);

  const onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void = useCallback((_, checked) => {
    setChecked(checked);
  }, []);

  return (
    <div className={styles.promptRoot} data-testid="experimental-prompt">
      <div className={styles.promptTitle}>
        {t[
          'com.yunke.settings.workspace.experimental-features.prompt-header'
        ]()}
      </div>
      <div className={styles.promptArt}>
        <ExperimentalFeatureArts />
      </div>
      <div className={styles.promptWarning}>
        <div className={styles.promptWarningTitle}>
          {t[
            'com.yunke.settings.workspace.experimental-features.prompt-warning-title'
          ]()}
        </div>
        {t[
          'com.yunke.settings.workspace.experimental-features.prompt-warning'
        ]()}
      </div>

      <div className={styles.spacer} />

      <label className={styles.promptDisclaimer}>
        <Checkbox
          checked={checked}
          onChange={onChange}
          data-testid="experimental-prompt-disclaimer"
        />
        {t[
          'com.yunke.settings.workspace.experimental-features.prompt-disclaimer'
        ]()}
      </label>

      <div className={styles.promptDisclaimerConfirm}>
        <Button
          disabled={!checked}
          onClick={onConfirm}
          variant="primary"
          data-testid="experimental-confirm-button"
        >
          {t[
            'com.yunke.settings.workspace.experimental-features.get-started'
          ]()}
        </Button>
      </div>
    </div>
  );
};

const FeedbackIcon = ({ type }: { type: Flag['feedbackType'] }) => {
  switch (type) {
    case 'discord':
      return <DiscordIcon fontSize={16} />;
    case 'email':
      return <EmailIcon fontSize={16} />;
    case 'github':
      return <GithubIcon fontSize={16} />;
    default:
      return null;
  }
};

const feedbackLink: Record<NonNullable<Flag['feedbackType']>, string> = {
  discord: BUILD_CONFIG.discordUrl,
  email: 'mailto:support@toeverything.info',
  github: 'https://gitcode.com/xiaoleixiaolei/issues',
};

const ExperimentalFeaturesItem = ({
  flag,
  flagKey,
}: {
  flag: Flag;
  flagKey: string;
}) => {
  const value = useLiveData(flag.$);
  const t = useI18n();
  const onChange = useCallback(
    (checked: boolean) => {
      flag.set(checked);
    },
    [flag]
  );
  const link = flag.feedbackType
    ? flag.feedbackLink
      ? flag.feedbackLink
      : feedbackLink[flag.feedbackType]
    : undefined;

  if (flag.configurable === false || flag.hide) {
    return null;
  }

  return (
    <div className={styles.rowContainer}>
      <div className={styles.switchRow}>
        {t[flag.displayName]()}
        <Switch data-testid={flagKey} checked={value} onChange={onChange} />
      </div>
      {!!flag.description && (
        <Tooltip content={t[flag.description]()}>
          <div className={styles.description}>{t[flag.description]()}</div>
        </Tooltip>
      )}
      {!!flag.feedbackType && (
        <a
          className={styles.feedback}
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          <FeedbackIcon type={flag.feedbackType} />
          <span>关于此功能的讨论</span>
          <ArrowRightSmallIcon
            fontSize={20}
            className={styles.arrowRightIcon}
          />
        </a>
      )}
    </div>
  );
};

const PluginManagerPanel = () => {
  const { pluginService, pluginRuntimeService } = useServices({
    PluginService,
    PluginRuntimeService,
  });
  const plugins = useLiveData(pluginService.registry.plugins$) ?? [];

  const handleInstallDemo = useCallback(() => {
    pluginService.installDemoPlugin();
    notify.success({ title: '已安装示例插件' });
  }, [pluginService]);

  const handleImportZip = useAsyncCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const manifest = await pluginService.installFromZip(file);
        notify.success({ title: `已导入插件：${manifest.name}` });
      } catch (error) {
        console.error(error);
        notify.error({ title: '插件导入失败，请检查包格式' });
      }
    };
    input.click();
  }, [pluginService]);

  const handleToggle = useCallback(
    (id: string, enabled: boolean) => {
      if (enabled) {
        pluginService.enable(id);
      } else {
        pluginService.disable(id);
      }
    },
    [pluginService]
  );

  const handleUninstall = useCallback(
    (id: string) => {
      pluginService.uninstall(id);
      notify.success({ title: '插件已卸载' });
    },
    [pluginService]
  );

  const handleRunCommand = useCallback(
    (commandId: string) => {
      const ok = pluginRuntimeService.executeCommand(commandId);
      if (!ok) {
        notify.error({ title: '命令不可用，请先启用插件' });
      }
    },
    [pluginRuntimeService]
  );

  return (
    <div className={styles.pluginSection}>
      <div className={styles.subHeader}>插件管理（实验）</div>
      <div className={styles.pluginActionRow}>
        <Button size="small" variant="primary" onClick={handleImportZip}>
          导入插件
        </Button>
        <Button size="small" variant="secondary" onClick={handleInstallDemo}>
          安装示例
        </Button>
      </div>
      {plugins.length === 0 ? (
        <div className={styles.pluginEmpty}>暂无插件</div>
      ) : (
        <div className={styles.pluginList}>
          {plugins.map(record => {
            const commands = record.manifest.contributes?.command ?? [];
            return (
              <div key={record.manifest.id} className={styles.pluginCard}>
                <div className={styles.pluginBody}>
                  <div className={styles.pluginInfo}>
                    <div className={styles.pluginTitle}>
                      {record.manifest.name}
                      <span className={styles.pluginVersion}>
                        {record.manifest.version}
                      </span>
                    </div>
                    <div className={styles.pluginMeta}>
                      {record.manifest.id} ·{' '}
                      {record.source === 'builtin' ? '内置' : '本地'}
                    </div>
                  </div>
                  {commands.length > 0 ? (
                    <div className={styles.pluginCommandList}>
                      <div className={styles.pluginCommandTitle}>命令</div>
                      {commands.map(command => (
                        <div
                          key={command.id}
                          className={styles.pluginCommandRow}
                        >
                          <div className={styles.pluginCommandLabel}>
                            {command.label}
                          </div>
                          <Button
                            size="small"
                            variant="secondary"
                            disabled={!record.enabled}
                            onClick={() => handleRunCommand(command.id)}
                          >
                            执行
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={styles.pluginControls}>
                  <Switch
                    checked={record.enabled}
                    onChange={checked =>
                      handleToggle(record.manifest.id, checked)
                    }
                  />
                  {record.source !== 'builtin' ? (
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleUninstall(record.manifest.id)}
                    >
                      卸载
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ExperimentalFeaturesMain = () => {
  const t = useI18n();
  const { featureFlagService } = useServices({ FeatureFlagService });

  return (
    <>
      <SettingHeader
        title={t[
          'com.yunke.settings.workspace.experimental-features.header.plugins'
        ]()}
        subtitle={t[
          'com.yunke.settings.workspace.experimental-features.header.subtitle'
        ]()}
      />
      <div
        className={styles.settingsContainer}
        data-testid="experimental-settings"
      >
        {Object.keys(YUNKE_FLAGS).map(key => (
          <ExperimentalFeaturesItem
            key={key}
            flagKey={key}
            flag={featureFlagService.flags[key as keyof YUNKE_FLAGS]}
          />
        ))}
        <PluginManagerPanel />
      </div>
    </>
  );
};

// TODO(@Peng): save to workspace meta instead?
const experimentalFeaturesDisclaimerAtom = atomWithStorage(
  'yunke:experimental-features-disclaimer',
  false
);

export const ExperimentalFeatures = () => {
  const [enabled, setEnabled] = useAtom(experimentalFeaturesDisclaimerAtom);
  const handleConfirm = useAsyncCallback(async () => {
    setEnabled(true);
  }, [setEnabled]);
  if (!enabled) {
    return <ExperimentalFeaturesPrompt onConfirm={handleConfirm} />;
  } else {
    return (
      <Suspense fallback={<Loading />}>
        <ExperimentalFeaturesMain />
      </Suspense>
    );
  }
};
