import { toast } from '@yunke/component';
import {
  pushGlobalLoadingEventAtom,
  resolveGlobalLoadingEventAtom,
} from '@yunke/component/global-loading';
import {
  AIProvider,
  CopilotClient,
  setupAIProvider,
} from '@yunke/core/blocksuite/ai';
import { useRegisterFindInPageCommands } from '@yunke/core/components/hooks/yunke/use-register-find-in-page-commands';
import { useRegisterWorkspaceCommands } from '@yunke/core/components/hooks/use-register-workspace-commands';
import { useStorageErrorListener } from '@yunke/core/components/hooks/use-storage-error-listener';
import { OverCapacityNotification } from '@yunke/core/components/over-capacity';
import {
  AuthService,
  EventSourceService,
  FetchService,
} from '@yunke/core/modules/cloud';
import {
  GlobalDialogService,
  WorkspaceDialogService,
} from '@yunke/core/modules/dialogs';
import { DocsService } from '@yunke/core/modules/doc';
import { EditorSettingService } from '@yunke/core/modules/editor-setting';
import { useRegisterNavigationCommands } from '@yunke/core/modules/navigation/view/use-register-navigation-commands';
import { QuickSearchContainer } from '@yunke/core/modules/quicksearch';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import {
  getYUNKEWorkspaceSchema,
  WorkspaceService,
} from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import type { DocMode } from '@blocksuite/yunke/model';
import { ZipTransformer } from '@blocksuite/yunke/widgets/linked-doc';
import {
  effect,
  fromPromise,
  onStart,
  throwIfAborted,
  useService,
  useServices,
} from '@toeverything/infra';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { catchError, EMPTY, finalize, switchMap, tap, timeout } from 'rxjs';

/**
 * @deprecated just for legacy code, will be removed in the future
 */
export const WorkspaceSideEffects = () => {
  const t = useI18n();
  const pushGlobalLoadingEvent = useSetAtom(pushGlobalLoadingEventAtom);
  const resolveGlobalLoadingEvent = useSetAtom(resolveGlobalLoadingEventAtom);
  const { workspaceService, docsService } = useServices({
    WorkspaceService,
    DocsService,
    EditorSettingService,
  });
  const currentWorkspace = workspaceService.workspace;
  const docsList = docsService.list;

  const workbench = useService(WorkbenchService).workbench;
  useEffect(() => {
    const insertTemplate = effect(
      switchMap(({ template, mode }: { template: string; mode: string }) => {
        return fromPromise(async abort => {
          const templateZip = await fetch(template, { signal: abort });
          const templateBlob = await templateZip.blob();
          throwIfAborted(abort);
          const [doc] = await ZipTransformer.importDocs(
            currentWorkspace.docCollection,
            getYUNKEWorkspaceSchema(),
            templateBlob
          );
          if (doc) {
            doc.resetHistory();
          }

          return { doc, mode };
        }).pipe(
          timeout(10000 /* 10秒 */),
          tap(({ mode, doc }) => {
            if (doc) {
              docsList.setPrimaryMode(doc.id, mode as DocMode);
              workbench.openDoc(doc.id);
            }
          }),
          onStart(() => {
            pushGlobalLoadingEvent({
              key: 'insert-template',
            });
          }),
          catchError(err => {
            console.error(err);
            toast(t['com.yunke.ai.template-insert.failed']());
            return EMPTY;
          }),
          finalize(() => {
            resolveGlobalLoadingEvent('insert-template');
          })
        );
      })
    );

    const disposable = AIProvider.slots.requestInsertTemplate.subscribe(
      ({ template, mode }) => {
        insertTemplate({ template, mode });
      }
    );

    return () => {
      disposable.unsubscribe();
      insertTemplate.unsubscribe();
    };
  }, [
    currentWorkspace.docCollection,
    docsList,
    pushGlobalLoadingEvent,
    resolveGlobalLoadingEvent,
    t,
    workbench,
  ]);

  const workspaceDialogService = useService(WorkspaceDialogService);
  const globalDialogService = useService(GlobalDialogService);

  useEffect(() => {
    const disposable = AIProvider.slots.requestUpgradePlan.subscribe(() => {
      workspaceDialogService.open('setting', {
        activeTab: 'billing',
      });
      track.$.paywall.aiAction.viewPlans();
    });
    return () => {
      disposable.unsubscribe();
    };
  }, [workspaceDialogService]);

  const eventSourceService = useService(EventSourceService);
  const fetchService = useService(FetchService);
  const authService = useService(AuthService);

  useEffect(() => {
    const dispose = setupAIProvider(
      new CopilotClient(
        null, // gql 参数（代码注释说不使用，传 null）
        fetchService.fetch, // fetcher 参数
        eventSourceService.eventSource // eventSource 参数
      ),
      globalDialogService,
      authService
    );
    return () => {
      dispose();
    };
  }, [
    eventSourceService,
    fetchService,
    workspaceDialogService,
    globalDialogService,
    authService,
  ]);

  useRegisterWorkspaceCommands();
  useRegisterNavigationCommands();
  useRegisterFindInPageCommands();
  
  // 🔧 监听存储错误事件，通知用户
  useStorageErrorListener();

  return (
    <>
      <QuickSearchContainer />
      <OverCapacityNotification />
    </>
  );
};
