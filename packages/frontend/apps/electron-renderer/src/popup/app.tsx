import { ThemeProvider } from '@yunke/core/components/theme-provider';
import { configureElectronStateStorageImpls } from '@yunke/core/desktop/storage';
import { configureDesktopApiModule } from '@yunke/core/modules/desktop-api';
import { configureI18nModule, I18nProvider } from '@yunke/core/modules/i18n';
import { configureStorageModule } from '@yunke/core/modules/storage';
import { configureEssentialThemeModule } from '@yunke/core/modules/theme';
import { appInfo } from '@yunke/electron-api';
import { Framework, FrameworkRoot } from '@toeverything/infra';

import * as styles from './app.css';
import { Recording } from './recording';

const framework = new Framework();
configureI18nModule(framework);
configureEssentialThemeModule(framework);
configureStorageModule(framework);
configureElectronStateStorageImpls(framework);
configureDesktopApiModule(framework);
const frameworkProvider = framework.provider();

const mode = appInfo?.windowName as 'notification' | 'recording';

export function App() {
  return (
    <FrameworkRoot framework={frameworkProvider}>
      <ThemeProvider>
        <I18nProvider>
          <div className={styles.root}>
            {mode === 'recording' && <Recording />}
          </div>
        </I18nProvider>
      </ThemeProvider>
    </FrameworkRoot>
  );
}
