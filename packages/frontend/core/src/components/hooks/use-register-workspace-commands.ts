import { AppSidebarService } from '@yunke/core/modules/app-sidebar';
import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import {
  GlobalDialogService,
  WorkspaceDialogService,
} from '@yunke/core/modules/dialogs';
import { I18nService } from '@yunke/core/modules/i18n';
import { UrlService } from '@yunke/core/modules/url';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import {
  useService,
  useServiceOptional,
  useServices,
} from '@toeverything/infra';
import { useStore } from 'jotai';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

import { usePageHelper } from '../../blocksuite/block-suite-page-list/utils';
import {
  PreconditionStrategy,
  registerYunkeCommand,
  registerYunkeCreationCommands,
  registerYunkeHelpCommands,
  // registerYunkeLanguageCommands, // 语言切换已禁用
  registerYunkeLayoutCommands,
  registerYunkeNavigationCommands,
  registerYunkeQuickMenuCommands,
  registerYunkeSettingsCommands,
  registerYunkeUpdatesCommands,
} from '../../commands';
import { EditorSettingService } from '../../modules/editor-setting';
import { CMDKQuickSearchService } from '../../modules/quicksearch/services/cmdk';
import { useNavigateHelper } from './use-navigate-helper';

function registerCMDKCommand(service: CMDKQuickSearchService) {
  return registerYunkeCommand({
    id: 'yunke:show-quick-search',
    preconditionStrategy: PreconditionStrategy.Never,
    category: 'yunke:general',
    keyBinding: {
      binding: '$mod+K',
    },
    label: '',
    icon: '',
    run() {
      service.toggle();
    },
  });
}

export function useRegisterWorkspaceCommands() {
  const store = useStore();
  const t = useI18n();
  const theme = useTheme();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const urlService = useService(UrlService);
  const pageHelper = usePageHelper(currentWorkspace.docCollection);
  const navigationHelper = useNavigateHelper();
  const {
    cMDKQuickSearchService,
    editorSettingService,
    workspaceDialogService,
    globalDialogService,
    appSidebarService,
    i18nService,
  } = useServices({
    CMDKQuickSearchService,
    EditorSettingService,
    WorkspaceDialogService,
    GlobalDialogService,
    AppSidebarService,
    I18nService,
  });

  const i18n = i18nService.i18n;

  const desktopApiService = useServiceOptional(DesktopApiService);
  const workbenchService = useServiceOptional(WorkbenchService);

  const quitAndInstall = desktopApiService?.handler.updater.quitAndInstall;

  useEffect(() => {
    const unsub = registerCMDKCommand(cMDKQuickSearchService);

    return () => {
      unsub();
    };
  }, [cMDKQuickSearchService]);

  // register YunkeUpdatesCommands
  useEffect(() => {
    if (!quitAndInstall) {
      return;
    }

    const unsub = registerYunkeUpdatesCommands({
      store,
      t,
      quitAndInstall,
    });

    return () => {
      unsub();
    };
  }, [quitAndInstall, store, t]);

  // register YunkeNavigationCommands
  useEffect(() => {
    const unsub = registerYunkeNavigationCommands({
      t,
      docCollection: currentWorkspace.docCollection,
      navigationHelper,
      workspaceDialogService,
      workbenchService,
    });

    return () => {
      unsub();
    };
  }, [
    t,
    currentWorkspace.docCollection,
    navigationHelper,
    workspaceDialogService,
    workbenchService,
  ]);

  // register YunkeSettingsCommands
  useEffect(() => {
    const unsub = registerYunkeSettingsCommands({
      store,
      t,
      theme,
      editorSettingService,
    });

    return () => {
      unsub();
    };
  }, [editorSettingService, store, t, theme]);

  // 语言切换命令已禁用 - 云客白板默认使用中文
  // useEffect(() => {
  //   const unsub = registerYunkeLanguageCommands({
  //     i18n,
  //     t,
  //   });
  //
  //   return () => {
  //     unsub();
  //   };
  // }, [i18n, t]);

  // register YunkeLayoutCommands
  useEffect(() => {
    const unsub = registerYunkeLayoutCommands({ t, appSidebarService });

    return () => {
      unsub();
    };
  }, [appSidebarService, store, t]);

  // register YunkeCreationCommands
  useEffect(() => {
    const unsub = registerYunkeCreationCommands({
      globalDialogService,
      pageHelper: pageHelper,
      t,
    });

    return () => {
      unsub();
    };
  }, [store, pageHelper, t, globalDialogService]);

  // register YunkeHelpCommands
  useEffect(() => {
    const unsub = registerYunkeHelpCommands({
      t,
      urlService,
      workspaceDialogService,
    });

    return () => {
      unsub();
    };
  }, [t, globalDialogService, urlService, workspaceDialogService]);

  // register YunkeQuickMenuCommands
  useEffect(() => {
    const unsub = registerYunkeQuickMenuCommands({
      t,
      store,
    });

    return () => {
      unsub();
    };
  }, [t, store]);
}
