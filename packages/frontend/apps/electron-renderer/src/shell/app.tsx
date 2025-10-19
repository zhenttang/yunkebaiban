import { useAppSettingHelper } from '@yunke/core/components/hooks/affine/use-app-setting-helper';
import { WindowsAppControls } from '@yunke/core/components/pure/header/windows-app-controls';
import { ThemeProvider } from '@yunke/core/components/theme-provider';
import { configureElectronStateStorageImpls } from '@yunke/core/desktop/storage';
import { configureAppSidebarModule } from '@yunke/core/modules/app-sidebar';
import { ShellAppSidebarFallback } from '@yunke/core/modules/app-sidebar/views';
import {
  AppTabsHeader,
  configureAppTabsHeaderModule,
} from '@yunke/core/modules/app-tabs-header';
import { configureDesktopApiModule } from '@yunke/core/modules/desktop-api';
import { configureI18nModule, I18nProvider } from '@yunke/core/modules/i18n';
import { configureStorageModule } from '@yunke/core/modules/storage';
import { configureAppThemeModule } from '@yunke/core/modules/theme';
import { Framework, FrameworkRoot } from '@toeverything/infra';

import * as styles from './app.css';

const framework = new Framework();
configureStorageModule(framework);
configureElectronStateStorageImpls(framework);
configureAppTabsHeaderModule(framework);
configureAppSidebarModule(framework);
configureI18nModule(framework);
configureDesktopApiModule(framework);
configureAppThemeModule(framework);
const frameworkProvider = framework.provider();

export function App() {
  const { appSettings } = useAppSettingHelper();
  const translucent =
    BUILD_CONFIG.isElectron &&
    environment.isMacOs &&
    appSettings.enableBlurBackground;
  return (
    <FrameworkRoot framework={frameworkProvider}>
      <ThemeProvider>
        <I18nProvider>
          <div className={styles.root} data-translucent={translucent}>
            <AppTabsHeader mode="shell" className={styles.appTabsHeader} />
            <div className={styles.body}>
              <ShellAppSidebarFallback />
            </div>
            {environment.isWindows && (
              <div style={{ position: 'fixed', right: 0, top: 0, zIndex: 5 }}>
                <WindowsAppControls />
              </div>
            )}
          </div>
        </I18nProvider>
      </ThemeProvider>
    </FrameworkRoot>
  );
}
