import { ChatPanel } from '@yunke/core/blocksuite/ai';
import type { YunkeEditorContainer } from '@yunke/core/blocksuite/block-suite-editor';
import { useAIChatConfig } from '@yunke/core/components/hooks/yunke/use-ai-chat-config';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { ViewExtensionManagerIdentifier } from '@blocksuite/yunke/ext-loader';
import { RefNodeSlotsProvider } from '@blocksuite/yunke/inlines/reference';
import { DocModeProvider } from '@blocksuite/yunke/shared/services';
import { createSignalFromObservable } from '@blocksuite/yunke/shared/utils';
import { useFramework } from '@toeverything/infra';
import { forwardRef, useEffect, useRef } from 'react';

import * as styles from './chat.css';

export interface SidebarTabProps {
  editor: YunkeEditorContainer | null;
  onLoad?: ((component: HTMLElement) => void) | null;
}

// A wrapper for CopilotPanel
export const EditorChatPanel = forwardRef(function EditorChatPanel(
  { editor, onLoad }: SidebarTabProps,
  ref: React.ForwardedRef<ChatPanel>
) {
  const chatPanelRef = useRef<ChatPanel | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const framework = useFramework();

  useEffect(() => {
    if (onLoad && chatPanelRef.current) {
      (chatPanelRef.current as ChatPanel).updateComplete
        .then(() => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(chatPanelRef.current);
            } else {
              ref.current = chatPanelRef.current;
            }
          }
        })
        .catch(console.error);
    }
  }, [onLoad, ref]);

  const {
    docDisplayConfig,
    searchMenuConfig,
    networkSearchConfig,
    reasoningConfig,
    modelSwitchConfig,
  } = useAIChatConfig();

  useEffect(() => {
    if (!editor || !editor.host) return;

    if (!chatPanelRef.current) {
      chatPanelRef.current = new ChatPanel();
      chatPanelRef.current.host = editor.host;
      chatPanelRef.current.doc = editor.doc;

      const workbench = framework.get(WorkbenchService).workbench;
      chatPanelRef.current.appSidebarConfig = {
        getWidth: () => {
          const width$ = workbench.sidebarWidth$;
          return createSignalFromObservable(width$, 0);
        },
        isOpen: () => {
          const open$ = workbench.sidebarOpen$;
          return createSignalFromObservable(open$, true);
        },
      };

      chatPanelRef.current.docDisplayConfig = docDisplayConfig;
      chatPanelRef.current.searchMenuConfig = searchMenuConfig;
      chatPanelRef.current.networkSearchConfig = networkSearchConfig;
      chatPanelRef.current.reasoningConfig = reasoningConfig;
      chatPanelRef.current.modelSwitchConfig = modelSwitchConfig;
      chatPanelRef.current.extensions = editor.host.std
        .get(ViewExtensionManagerIdentifier)
        .get('preview-page');
      chatPanelRef.current.yunkeFeatureFlagService =
        framework.get(FeatureFlagService);

      containerRef.current?.append(chatPanelRef.current);
    } else {
      chatPanelRef.current.host = editor.host;
      chatPanelRef.current.doc = editor.doc;
    }

    const docModeService = editor.host.std.get(DocModeProvider);
    const refNodeService = editor.host.std.getOptional(RefNodeSlotsProvider);
    const disposable = [
      refNodeService?.docLinkClicked.subscribe(({ host }) => {
        if (host === editor.host) {
          (chatPanelRef.current as ChatPanel).doc = editor.doc;
        }
      }),
      docModeService?.onPrimaryModeChange(() => {
        if (!editor.host) return;
        (chatPanelRef.current as ChatPanel).host = editor.host;
      }, editor.doc.id),
    ];

    return () => disposable.forEach(d => d?.unsubscribe());
  }, [
    docDisplayConfig,
    editor,
    framework,
    networkSearchConfig,
    searchMenuConfig,
    reasoningConfig,
    modelSwitchConfig,
  ]);

  return <div className={styles.root} ref={containerRef} />;
});
