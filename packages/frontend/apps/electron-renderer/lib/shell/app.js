import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppSettingHelper } from '@yunke/core/components/hooks/yunke/use-app-setting-helper';
import { WindowsAppControls } from '@yunke/core/components/pure/header/windows-app-controls';
import { ThemeProvider } from '@yunke/core/components/theme-provider';
import { configureElectronStateStorageImpls } from '@yunke/core/desktop/storage';
import { configureAppSidebarModule } from '@yunke/core/modules/app-sidebar';
import { ShellAppSidebarFallback } from '@yunke/core/modules/app-sidebar/views';
import { AppTabsHeader, configureAppTabsHeaderModule, } from '@yunke/core/modules/app-tabs-header';
import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
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
    const translucent = BUILD_CONFIG.isElectron &&
        environment.isMacOs &&
        appSettings.enableBlurBackground;
    return (_jsx(FrameworkRoot, { framework: frameworkProvider, children: _jsx(ThemeProvider, { children: _jsx(I18nProvider, { children: _jsx(CloudStorageProvider, { children: _jsxs("div", { className: styles.root, "data-translucent": translucent, children: [_jsx(AppTabsHeader, { mode: "shell", className: styles.appTabsHeader }), _jsx("div", { className: styles.body, children: _jsx(ShellAppSidebarFallback, {}) }), environment.isWindows && (_jsx("div", { style: { position: 'fixed', right: 0, top: 0, zIndex: 5 }, children: _jsx(WindowsAppControls, {}) }))] }) }) }) }) }));
}
//# sourceMappingURL=app.js.map