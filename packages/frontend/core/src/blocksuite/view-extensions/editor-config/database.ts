import { notify } from '@yunke/component';
import {
  generateUrl,
  type UseSharingUrl,
} from '@yunke/core/components/hooks/yunke/use-share-url';
import { ServerService } from '@yunke/core/modules/cloud';
import { EditorService } from '@yunke/core/modules/editor';
import { copyLinkToBlockStdScopeClipboard } from '@yunke/core/utils/clipboard';
import { I18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import {
  menu,
  type MenuOptions,
} from '@blocksuite/yunke/components/context-menu';
import type { DatabaseBlockModel } from '@blocksuite/yunke/model';
import { LinkIcon } from '@blocksuite/icons/lit';
import type { FrameworkProvider } from '@toeverything/infra';

export function createDatabaseOptionsConfig(framework: FrameworkProvider) {
  return {
    configure: (model: DatabaseBlockModel, options: MenuOptions) => {
      const items = options.items;

      items.splice(2, 0, createCopyLinkToBlockMenuItem(framework, model));

      return options;
    },
  };
}

function createCopyLinkToBlockMenuItem(
  framework: FrameworkProvider,
  model: DatabaseBlockModel
) {
  return menu.action({
    name: '复制块链接',
    prefix: LinkIcon({ width: '20', height: '20' }),
    hide: () => {
      const { editor } = framework.get(EditorService);
      const mode = editor.mode$.value;
      return mode === 'edgeless';
    },
    select: () => {
      const serverService = framework.get(ServerService);
      const pageId = model.store.id;
      const { editor } = framework.get(EditorService);
      const mode = editor.mode$.value;

      if (mode === 'edgeless') return;

      const workspaceId = editor.doc.workspace.id;
      const options: UseSharingUrl = {
        workspaceId,
        pageId,
        mode,
        blockIds: [model.id],
      };

      const str = generateUrl({
        ...options,
        baseUrl: serverService.server.baseUrl,
      });
      if (!str) return;

      const type = model.flavour;
      const page = editor.editorContainer$.value;

      // 🔧 安全检查：确保 clipboard 存在（Android 环境可能延迟初始化）
      const clipboard = page?.host?.std?.clipboard;
      if (!clipboard) {
        console.warn('[Database] clipboard 未就绪，跳过复制链接功能');
        notify.error({ title: '复制功能暂不可用，请稍后再试' });
        return;
      }

      copyLinkToBlockStdScopeClipboard(str, clipboard)
        .then(success => {
          if (!success) return;

          notify.success({ title: I18n['Copied link to clipboard']() });
        })
        .catch(console.error);

      track.doc.editor.toolbar.copyBlockToLink({ type });
    },
  });
}
