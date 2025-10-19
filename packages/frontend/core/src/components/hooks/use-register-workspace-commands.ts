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
  registerAffineCommand,
  registerAffineCreationCommands,
  registerAffineHelpCommands,
  registerAffineLanguageCommands,
  registerAffineLayoutCommands,
  registerAffineNavigationCommands,
  registerAffineQuickMenuCommands,
  registerAffineSettingsCommands,
  registerAffineUpdatesCommands,
} from '../../commands';
import { EditorSettingService } from '../../modules/editor-setting';
import { CMDKQuickSearchService } from '../../modules/quicksearch/services/cmdk';
import { useNavigateHelper } from './use-navigate-helper';

function registerCMDKCommand(service: CMDKQuickSearchService) {
  return registerAffineCommand({
    id: 'affine:show-quick-search',
    preconditionStrategy: PreconditionStrategy.Never,
    category: 'affine:general',
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

  // register AffineUpdatesCommands
  useEffect(() => {
    if (!quitAndInstall) {
      return;
    }

    const unsub = registerAffineUpdatesCommands({
      store,
      t,
      quitAndInstall,
    });

    return () => {
      unsub();
    };
  }, [quitAndInstall, store, t]);

  // register AffineNavigationCommands
  useEffect(() => {
    const unsub = registerAffineNavigationCommands({
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

  // register AffineSettingsCommands
  useEffect(() => {
    const unsub = registerAffineSettingsCommands({
      store,
      t,
      theme,
      editorSettingService,
    });

    return () => {
      unsub();
    };
  }, [editorSettingService, store, t, theme]);

  useEffect(() => {
    const unsub = registerAffineLanguageCommands({
      i18n,
      t,
    });

    return () => {
      unsub();
    };
  }, [i18n, t]);

  // register AffineLayoutCommands
  useEffect(() => {
    const unsub = registerAffineLayoutCommands({ t, appSidebarService });

    return () => {
      unsub();
    };
  }, [appSidebarService, store, t]);

  // register AffineCreationCommands
  useEffect(() => {
    const unsub = registerAffineCreationCommands({
      globalDialogService,
      pageHelper: pageHelper,
      t,
    });

    return () => {
      unsub();
    };
  }, [store, pageHelper, t, globalDialogService]);

  // register AffineHelpCommands
  useEffect(() => {
    const unsub = registerAffineHelpCommands({
      t,
      urlService,
      workspaceDialogService,
    });

    return () => {
      unsub();
    };
  }, [t, globalDialogService, urlService, workspaceDialogService]);

  // register AffineQuickMenuCommands
  useEffect(() => {
    const unsub = registerAffineQuickMenuCommands({
      t,
      store,
    });

    return () => {
      unsub();
    };
  }, [t, store]);
}
