import { BrowserWarning, LocalDemoTips } from '@yunke/component/yunke-banner';
import { Trans, useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useState, useMemo } from 'react';

import { useEnableCloud } from '../components/hooks/yunke/use-enable-cloud';
import { AuthService } from '../modules/cloud';
import { GlobalDialogService } from '../modules/dialogs';
import type { Workspace } from '../modules/workspace';

const minimumChromeVersion = 106;

// 本周不提示的 localStorage key
const LOCAL_DEMO_TIPS_DISMISS_KEY = 'yunke:local-demo-tips:dismiss-until';

// 检查是否在本周内已经关闭过
const isDismissedForWeek = (): boolean => {
  try {
    const dismissUntil = localStorage.getItem(LOCAL_DEMO_TIPS_DISMISS_KEY);
    if (!dismissUntil) return false;
    const dismissDate = new Date(dismissUntil);
    return dismissDate > new Date();
  } catch {
    return false;
  }
};

// 设置本周不提示
const setDismissForWeek = (): void => {
  try {
    const now = new Date();
    // 设置到下周同一天
    const dismissUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    localStorage.setItem(LOCAL_DEMO_TIPS_DISMISS_KEY, dismissUntil.toISOString());
  } catch {
    // 忽略存储错误
  }
};

const shouldShowWarning = (() => {
  if (BUILD_CONFIG.isElectron) {
    // Even if desktop version has compatibility issues,
    // we don't want to show warnings
    return false;
  }
  if (BUILD_CONFIG.isMobileEdition) {
    return true;
  }
  if (environment.isChrome && environment.chromeVersion) {
    return environment.chromeVersion < minimumChromeVersion;
  }
  return false;
})();

const OSWarningMessage = () => {
  const t = useI18n();
  const notChrome = !environment.isChrome;
  const notGoodVersion =
    environment.isChrome &&
    environment.chromeVersion &&
    environment.chromeVersion < minimumChromeVersion;

  // TODO(@L-Sun): Remove this message when mobile version can edit.
  if (environment.isMobile) {
    return <span>{t['com.yunke.top-tip.mobile']()}</span>;
  }

  if (notChrome) {
    return (
      <span>
        <Trans i18nKey="recommendBrowser">
          We recommend using <strong>Chrome</strong> browser for the best
          experience.
        </Trans>
      </span>
    );
  } else if (notGoodVersion) {
    return <span>{t['upgradeBrowser']()}</span>;
  }

  return null;
};

export const TopTip = ({
  pageId,
  workspace,
}: {
  pageId?: string;
  workspace: Workspace;
}) => {
  const loginStatus = useLiveData(useService(AuthService).session.status$);
  const isLoggedIn = loginStatus === 'authenticated';

  const [showWarning, setShowWarning] = useState(shouldShowWarning);
  // 初始化时检查是否在本周内已经关闭过
  const [showLocalDemoTips, setShowLocalDemoTips] = useState(() => !isDismissedForWeek());
  const confirmEnableCloud = useEnableCloud();

  const globalDialogService = useService(GlobalDialogService);
  const onLogin = useCallback(() => {
    globalDialogService.open('sign-in', {});
  }, [globalDialogService]);

  // 本周不再提示
  const handleDismissForWeek = useCallback(() => {
    setDismissForWeek();
    setShowLocalDemoTips(false);
  }, []);

  if (
    !BUILD_CONFIG.isElectron &&
    showLocalDemoTips &&
    workspace.flavour === 'local'
  ) {
    return (
      <LocalDemoTips
        isLoggedIn={isLoggedIn}
        onLogin={onLogin}
        onEnableCloud={() =>
          confirmEnableCloud(workspace, { openPageId: pageId })
        }
        onClose={() => {
          setShowLocalDemoTips(false);
        }}
        onDismissForWeek={handleDismissForWeek}
      />
    );
  }

  return (
    <BrowserWarning
      show={showWarning}
      message={<OSWarningMessage />}
      onClose={() => {
        setShowWarning(false);
      }}
    />
  );
};
