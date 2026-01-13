import { configureElectronStateStorageImpls } from '@yunke/core/desktop/storage';
import { configureCommonModules } from '@yunke/core/modules';
import { configureAppTabsHeaderModule } from '@yunke/core/modules/app-tabs-header';
import { configureDesktopBackupModule } from '@yunke/core/modules/backup';
import { ValidatorProvider } from '@yunke/core/modules/cloud';
import {
  configureDesktopApiModule,
  DesktopApiService,
} from '@yunke/core/modules/desktop-api';
import {
  configureSpellCheckSettingModule,
  configureTraySettingModule,
} from '@yunke/core/modules/editor-setting';
import { configureFindInPageModule } from '@yunke/core/modules/find-in-page';
import {
  ClientSchemeProvider,
  PopupWindowProvider,
} from '@yunke/core/modules/url';
import { configureDesktopWorkbenchModule } from '@yunke/core/modules/workbench';
import { configureBrowserWorkspaceFlavours } from '@yunke/core/modules/workspace-engine';
import { Framework } from '@toeverything/infra';

export function setupModules() {
  const framework = new Framework();
  configureCommonModules(framework);
  configureElectronStateStorageImpls(framework);
  configureBrowserWorkspaceFlavours(framework);
  configureDesktopWorkbenchModule(framework);
  configureAppTabsHeaderModule(framework);
  configureFindInPageModule(framework);
  configureDesktopApiModule(framework);
  configureSpellCheckSettingModule(framework);
  configureTraySettingModule(framework);
  configureDesktopBackupModule(framework);

  framework.impl(PopupWindowProvider, p => {
    const apis = p.get(DesktopApiService).api;
    return {
      open: (url: string) => {
        apis.handler.ui.openExternal(url).catch(e => {
          console.error('无法打开外部链接', e);
        });
      },
    };
  });
  framework.impl(ClientSchemeProvider, p => {
    const appInfo = p.get(DesktopApiService).appInfo;
    return {
      getClientScheme() {
        return appInfo?.scheme;
      },
    };
  });
  framework.impl(ValidatorProvider, p => {
    const apis = p.get(DesktopApiService).api;
    return {
      async validate(_challenge, resource) {
        const token = await apis.handler.ui.getChallengeResponse(resource);
        if (!token) {
          throw new Error('验证失败');
        }
        return token;
      },
    };
  });

  const frameworkProvider = framework.provider();

  return { framework, frameworkProvider };
}
