import { Button } from '@yunke/component';
import { AuthHeader } from '@yunke/component/auth-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { useWorkspaceName } from '@yunke/core/components/hooks/use-workspace-info';
import { WorkspaceSelector } from '@yunke/core/components/workspace-selector';
import { AuthService, ServerService } from '@yunke/core/modules/cloud';
import {
  type ClipperInput,
  ImportClipperService,
} from '@yunke/core/modules/import-clipper';
import {
  type WorkspaceMetadata,
  WorkspacesService,
} from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { AllDocsIcon } from '@blocksuite/icons/rc';
import { LiveData, useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useCallback, useEffect, useRef, useState } from 'react';

import * as styles from './style.css';

const clipperInput$ = new LiveData<ClipperInput | null>(null);
const port$ = new LiveData<MessagePort | null>(null);

console.log('🟢 设置 message 监听器');

window.addEventListener('message', event => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 收到 message 事件:', event);
  console.log('🔵 - origin:', event.origin);
  console.log('🔵 - source:', event.source);
  console.log('🔵 - data 类型:', typeof event.data);
  console.log('🔵 - data 值:', event.data);
  
  // 详细显示 data 的内容
  if (event.data === null) {
    console.log('⚠️ data 是 null');
  } else if (event.data === undefined) {
    console.log('⚠️ data 是 undefined');
  } else if (typeof event.data === 'string') {
    console.log('⚠️ data 是字符串:', event.data);
  } else if (typeof event.data === 'object') {
    console.log('🔵 - data.type:', event.data.type);
    console.log('🔵 - data.payload:', event.data.payload);
    console.log('🔵 - data 所有键:', Object.keys(event.data));
    console.log('🔵 - data 完整内容:', JSON.stringify(event.data, null, 2));
  }
  
  console.log('🔵 - ports 数量:', event.ports?.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (
    typeof event.data === 'object' &&
    event.data !== null &&
    event.data.type === 'yunke-clipper:import'
  ) {
    console.log('✅✅✅ 匹配到 yunke-clipper:import 类型！');
    console.log('🔵 payload:', event.data.payload);
    
    clipperInput$.value = event.data.payload;

    if (event.ports.length > 0) {
      console.log('🔵 设置 MessagePort');
      port$.value = event.ports[0];
    }
  } else {
    console.log('❌ 消息类型不匹配或格式错误');
    console.log('❌ - 判断条件:');
    console.log('  - typeof event.data === "object"?', typeof event.data === 'object');
    console.log('  - event.data !== null?', event.data !== null);
    console.log('  - event.data.type === "yunke-clipper:import"?', event.data?.type === 'yunke-clipper:import');
  }
});

export const Component = () => {
  console.log('🟢🟢🟢 ImportClipper 组件开始加载');
  
  const importClipperService = useService(ImportClipperService);
  const t = useI18n();
  const session = useService(AuthService).session;
  const sessionStatus = useLiveData(session.status$);
  const notLogin = sessionStatus === 'unauthenticated';
  
  console.log('🔵 Session 状态:', sessionStatus);
  console.log('🔵 notLogin:', notLogin);

  const [importing, setImporting] = useState(false);
  const [importingError, setImportingError] = useState<any>(null);
  const clipperInput = useLiveData(clipperInput$);
  const [clipperInputSnapshot, setClipperInputSnapshot] =
    useState<ClipperInput | null>(null);
  const isMissingInput = !clipperInputSnapshot;
  const workspaceStrategy = clipperInputSnapshot?.workspace ?? 'select-by-user';
  const serverService = useService(ServerService);
  const workspacesService = useService(WorkspacesService);
  const serverConfig = useLiveData(serverService.server.config$);
  const workspaces = useLiveData(workspacesService.list.workspaces$);
  const [rawSelectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceMetadata | null>(null);
  const [lastOpenedWorkspaceId] = useState(() =>
    localStorage.getItem('last_workspace_id')
  );
  const selectedWorkspace =
    rawSelectedWorkspace ??
    workspaces.find(w => w.id === lastOpenedWorkspaceId) ??
    workspaces.find(w => w.flavour !== 'local') ??
    workspaces.at(0);
  const selectedWorkspaceName = useWorkspaceName(selectedWorkspace);

  const noWorkspace = workspaces.length === 0;
  
  console.log('🔵 Workspaces 数量:', workspaces.length);
  console.log('🔵 clipperInput:', clipperInput);
  console.log('🔵 isMissingInput:', isMissingInput);

  useEffect(() => {
    workspacesService.list.revalidate();
  }, [workspacesService]);

  useEffect(() => {
    session.revalidate();
  }, [session]);

  useEffect(() => {
    if (!clipperInputSnapshot) {
      setClipperInputSnapshot(clipperInput);
    }
  }, [clipperInput, clipperInputSnapshot]);

  const handleSelectedWorkspace = useCallback(
    (workspaceMetadata: WorkspaceMetadata) => {
      return setSelectedWorkspace(workspaceMetadata);
    },
    []
  );

  const handleCreatedWorkspace = useCallback(
    (payload: { metadata: WorkspaceMetadata; defaultDocId?: string }) => {
      return setSelectedWorkspace(payload.metadata);
    },
    []
  );

  const handleSuccess = useCallback(() => {
    const arg = { type: 'yunke-clipper:import:success' };
    const port = port$.value;
    track.clipper.$.$.createDoc();
    if (port) {
      port.postMessage(arg);
    } else {
      window.postMessage(arg);
    }
    window.close();
  }, []);

  const handleImportToSelectedWorkspace = useAsyncCallback(async () => {
    if (clipperInputSnapshot && selectedWorkspace) {
      // save the last opened workspace id
      localStorage.setItem('last_workspace_id', selectedWorkspace.id);
      setImporting(true);
      try {
        await importClipperService.importToWorkspace(
          selectedWorkspace,
          clipperInputSnapshot
        );
        handleSuccess();
      } catch (err) {
        setImportingError(err);
      } finally {
        setImporting(false);
      }
    }
  }, [
    clipperInputSnapshot,
    handleSuccess,
    importClipperService,
    selectedWorkspace,
  ]);

  const handleImportToNewWorkspace = useAsyncCallback(async () => {
    if (!clipperInputSnapshot) {
      return;
    }
    setImporting(true);
    try {
      await importClipperService.importToNewWorkspace(
        'yunke-cloud',
        'Workspace',
        clipperInputSnapshot
      );
      handleSuccess();
    } catch (err) {
      setImportingError(err);
    } finally {
      setImporting(false);
    }
  }, [clipperInputSnapshot, handleSuccess, importClipperService]);

  const handleClickSignIn = useCallback(() => {
    window.open(
      `/sign-in?redirect_uri=${encodeURIComponent('CLOSE_POPUP')}`,
      '_blank',
      'popup'
    );
  }, []);

  const autoImportTriggered = useRef(false);

  useEffect(() => {
    if (isMissingInput) {
      return;
    }
    // use ref to avoid multiple auto import
    // and make sure the following code only runs once
    if (autoImportTriggered.current) {
      return;
    }
    autoImportTriggered.current = true;

    // 本地部署允许自动导入
    // if not login, we don't auto import
    // if (notLogin) {
    //   return;
    // }

    // if the workspace strategy is last-open-workspace, we automatically click the import button
    if (
      workspaceStrategy === 'last-open-workspace' &&
      selectedWorkspace?.id === lastOpenedWorkspaceId
    ) {
      handleImportToSelectedWorkspace();
    }
  }, [
    workspaceStrategy,
    selectedWorkspace,
    handleImportToSelectedWorkspace,
    lastOpenedWorkspaceId,
    isMissingInput,
    notLogin,
  ]);

  const disabled = isMissingInput || importing; // 移除 notLogin 检查
  
  console.log('🔵 disabled:', disabled);
  console.log('🔵 准备渲染，检查条件...');
  console.log('🔵 - notLogin:', notLogin, '(已被注释，不会阻止渲染)');
  console.log('🔵 - noWorkspace:', noWorkspace);
  console.log('🔵 - selectedWorkspace:', selectedWorkspace);

  // 注释掉登录验证，允许本地使用
  // if (notLogin) {
  //   console.log('❌ 被 notLogin 拦截（但这段代码已注释）');
  //   // not login
  //   return (
  //     <div className={styles.container}>
  //       <AuthHeader
  //         className={styles.authHeader}
  //         title={t['com.yunke.auth.sign.in']()}
  //         subTitle={serverConfig.serverName}
  //       />
  //       <Button
  //         className={styles.mainButton}
  //         variant="primary"
  //         onClick={handleClickSignIn}
  //       >
  //         {t['com.yunke.auth.sign.in']()}
  //       </Button>
  //     </div>
  //   );
  // }

  console.log('✅ 渲染主界面');
  
  return (
    <div className={styles.container}>
      <AllDocsIcon className={styles.mainIcon} />
      <h6 className={styles.mainTitle}>
        {t['com.yunke.import-clipper.dialog.createDocFromClipper']()}
      </h6>
      {noWorkspace ? (
        <p className={styles.desc}>A new workspace will be created.</p>
      ) : (
        <>
          <p className={styles.desc}>Choose a workspace.</p>
          <WorkspaceSelector
            workspaceMetadata={selectedWorkspace}
            onSelectWorkspace={handleSelectedWorkspace}
            onCreatedWorkspace={handleCreatedWorkspace}
            className={styles.workspaceSelector}
            showArrowDownIcon
            disable={disabled}
            menuContentOptions={{
              side: 'top',
              style: {
                maxHeight: 'min(600px, calc(50vh + 50px))',
                width: 352,
                maxWidth: 'calc(100vw - 20px)',
              },
            }}
          />
        </>
      )}
      <div className={styles.buttonContainer}>
        {importingError && (
          <span style={{ color: cssVar('warningColor') }}>
            {t['com.yunke.import-clipper.dialog.errorImport']()}
          </span>
        )}
        {isMissingInput ? (
          <span style={{ color: cssVar('warningColor') }}>
            {t['com.yunke.import-clipper.dialog.errorLoad']()}
          </span>
        ) : selectedWorkspace ? (
          <Button
            className={styles.mainButton}
            variant={disabled ? 'secondary' : 'primary'}
            loading={disabled}
            disabled={disabled}
            onClick={handleImportToSelectedWorkspace}
            data-testid="import-clipper-to-workspace-btn"
          >
            {selectedWorkspaceName &&
              t['com.yunke.import-clipper.dialog.createDocToWorkspace']({
                workspace: selectedWorkspaceName,
              })}
          </Button>
        ) : (
          <Button
            className={styles.mainButton}
            variant="primary"
            loading={disabled}
            disabled={disabled}
            onClick={handleImportToNewWorkspace}
          >
            {t['com.yunke.import-clipper.dialog.createDocToNewWorkspace']()}
          </Button>
        )}
      </div>
    </div>
  );
};
