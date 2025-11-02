import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider } from '@yunke/core/components/theme-provider';
import { configureElectronStateStorageImpls } from '@yunke/core/desktop/storage';
import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
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
const mode = appInfo?.windowName;
export function App() {
    return (_jsx(FrameworkRoot, { framework: frameworkProvider, children: _jsx(ThemeProvider, { children: _jsx(I18nProvider, { children: _jsx(CloudStorageProvider, { children: _jsx("div", { className: styles.root, children: mode === 'recording' && _jsx(Recording, {}) }) }) }) }) }));
}
//# sourceMappingURL=app.js.map