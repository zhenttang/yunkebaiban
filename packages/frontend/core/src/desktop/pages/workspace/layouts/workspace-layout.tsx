import { uniReactRoot } from '@yunke/component';
import { AiLoginRequiredModal } from '@yunke/core/components/affine/auth/ai-login-required';
import { useResponsiveSidebar } from '@yunke/core/components/hooks/use-responsive-siedebar';
import { SWRConfigProvider } from '@yunke/core/components/providers/swr-config-provider';
import { WorkspaceSideEffects } from '@yunke/core/components/providers/workspace-side-effects';
import { AIIsland } from '@yunke/core/desktop/components/ai-island';
import { AppContainer } from '@yunke/core/desktop/components/app-container';
import { DocumentTitle } from '@yunke/core/desktop/components/document-title';
import { WorkspaceDialogs } from '@yunke/core/desktop/dialogs';
import { PeekViewManagerModal } from '@yunke/core/modules/peek-view';
import { QuotaCheck } from '@yunke/core/modules/quota';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { LiveData, useLiveData, useService } from '@toeverything/infra';
import type { PropsWithChildren } from 'react';

export const WorkspaceLayout = function WorkspaceLayout({
  children,
}: PropsWithChildren) {
  const currentWorkspace = useService(WorkspaceService).workspace;
  return (
    <SWRConfigProvider>
      <WorkspaceDialogs />

      {/* ---- 一些副作用组件 ---- */}
      {currentWorkspace?.flavour !== 'local' ? (
        <QuotaCheck workspaceMeta={currentWorkspace.meta} />
      ) : null}
      <AiLoginRequiredModal />
      <WorkspaceSideEffects />
      <PeekViewManagerModal />
      <DocumentTitle />

      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
      {/* 应该在工作区加载后显示 */}
      {/* FIXME: 等待更好的 ai, <WorkspaceAIOnboarding /> */}
      <AIIsland />
      <uniReactRoot.Root />
    </SWRConfigProvider>
  );
};

/**
 * 包装工作区布局主路由视图
 */
const WorkspaceLayoutUIContainer = ({ children }: PropsWithChildren) => {
  const workbench = useService(WorkbenchService).workbench;
  const currentPath = useLiveData(
    LiveData.computed(get => {
      return get(workbench.basename$) + get(workbench.location$).pathname;
    })
  );
  useResponsiveSidebar();

  return (
    <AppContainer data-current-path={currentPath}>{children}</AppContainer>
  );
};
const WorkspaceLayoutInner = ({ children }: PropsWithChildren) => {
  return <WorkspaceLayoutUIContainer>{children}</WorkspaceLayoutUIContainer>;
};
