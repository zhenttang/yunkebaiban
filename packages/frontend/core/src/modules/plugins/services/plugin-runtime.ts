import { registerYunkeCommand } from '@yunke/core/commands';
import { OnEvent, Service } from '@toeverything/infra';

import { ApplicationStarted } from '../../lifecycle';
import { WorkspaceService } from '../../workspace';
import { WorkbenchService } from '../../workbench';
import { PluginRegistry } from '../entities/plugin-registry';
import type { PluginRecord } from '../types';
import { PluginRuntime, type DocAccessor } from '../runtime/plugin-runtime';

@OnEvent(ApplicationStarted, e => e.setupRuntime)
export class PluginRuntimeService extends Service {
  private runtimeMap = new Map<string, PluginRuntime>();
  private subscription?: { unsubscribe: () => void };
  private commandUnsubs = new Map<string, () => void>();
  private commandToPlugin = new Map<string, string>();

  private registry = this.framework.createEntity(PluginRegistry);

  /**
   * 🔧 P3 补全：创建 DocAccessor 实现
   */
  private createDocAccessor(): DocAccessor {
    return {
      getActiveDocId: () => {
        try {
          // 从 Workbench 获取当前活动文档 ID
          const workbenchService = this.framework.getOptional(WorkbenchService);
          if (!workbenchService) {
            console.warn('[plugins] DocAccessor: WorkbenchService 不可用');
            return null;
          }
          
          const location = workbenchService.workbench.location$.value;
          // 解析路径，格式如 /docId 或 /docId?xxx
          const pathname = location.pathname;
          if (pathname && pathname.startsWith('/')) {
            const docId = pathname.split('/')[1];
            // 过滤特殊路径
            if (docId && !['all', 'trash', 'collection', 'tag', 'settings'].includes(docId)) {
              return docId;
            }
          }
          return null;
        } catch (e) {
          console.error('[plugins] DocAccessor.getActiveDocId 错误:', e);
          return null;
        }
      },
      
      getYDoc: (docId: string) => {
        // L-19 修复：验证 docId 参数
        if (!docId || typeof docId !== 'string') {
          console.warn('[plugins] DocAccessor.getYDoc: docId 参数无效');
          return null;
        }
        try {
          const workspaceService = this.framework.getOptional(WorkspaceService);
          if (!workspaceService) {
            console.warn('[plugins] DocAccessor: WorkspaceService 不可用');
            return null;
          }
          
          const workspace = workspaceService.workspace;
          const docCollection = workspace.docCollection;
          const blockSuiteDoc = docCollection.getDoc(docId);
          
          if (!blockSuiteDoc) {
            console.warn(`[plugins] DocAccessor: 文档未找到 (docId: ${docId})`);
            return null;
          }
          
          // 返回底层 Yjs Doc
          return blockSuiteDoc.spaceDoc;
        } catch (e) {
          console.error('[plugins] DocAccessor.getYDoc 错误:', e);
          return null;
        }
      },
      
      getDocTitle: (docId: string) => {
        try {
          const workspaceService = this.framework.getOptional(WorkspaceService);
          if (!workspaceService) {
            return undefined;
          }
          
          const workspace = workspaceService.workspace;
          const docs = workspace.docs;
          const docRecord = docs.list.doc$(docId).value;
          
          return docRecord?.title$.value;
        } catch (e) {
          console.error('[plugins] DocAccessor.getDocTitle 错误:', e);
          return undefined;
        }
      },
    };
  }

  setupRuntime() {
    this.sync(this.registry.getAll());
    this.subscription = this.registry.plugins$.subscribe(records => {
      this.sync(records ?? []);
    });
  }

  private sync(records: PluginRecord[]) {
    const enabledIds = new Set(
      records.filter(record => record.enabled).map(record => record.manifest.id)
    );

    // 🔧 P3 补全：创建共享的 DocAccessor
    const docAccessor = this.createDocAccessor();

    records.forEach(record => {
      if (!record.enabled) return;
      if (this.runtimeMap.has(record.manifest.id)) return;
      // 🔧 P3 补全：传入 DocAccessor
      const runtime = new PluginRuntime(record, docAccessor);
      this.runtimeMap.set(record.manifest.id, runtime);
      runtime.start();
    });

    Array.from(this.runtimeMap.entries()).forEach(([id, runtime]) => {
      if (enabledIds.has(id)) return;
      runtime.stop();
      this.runtimeMap.delete(id);
    });

    this.syncCommands(records);
  }

  executeCommand(commandId: string) {
    const pluginId = this.commandToPlugin.get(commandId);
    if (!pluginId) return false;
    const runtime = this.runtimeMap.get(pluginId);
    if (!runtime) return false;
    runtime.invoke(commandId);
    return true;
  }

  private syncCommands(records: PluginRecord[]) {
    const nextCommandToPlugin = new Map<string, string>();

    const registerCommand = (
      record: PluginRecord,
      commandId: string,
      label: string
    ) => {
      if (!commandId) return;
      if (nextCommandToPlugin.has(commandId)) return;
      nextCommandToPlugin.set(commandId, record.manifest.id);
      if (this.commandUnsubs.has(commandId)) return;

      const unsub = registerYunkeCommand({
        id: commandId,
        label: {
          title: label,
          subTitle: record.manifest.name,
        },
        icon: null,
        category: 'yunke:general',
        run: () => {
          this.executeCommand(commandId);
        },
      });
      this.commandUnsubs.set(commandId, unsub);
    };

    records
      .filter(record => record.enabled)
      .forEach(record => {
        const contributes = record.manifest.contributes;
        const declared = contributes?.command ?? [];
        const toolbar = contributes?.toolbar ?? [];

        declared.forEach(item => {
          registerCommand(record, item.id, item.label || item.id);
        });
        toolbar.forEach(item => {
          if (!item.command) return;
          registerCommand(record, item.command, item.label || item.command);
        });
      });

    this.commandUnsubs.forEach((unsub, commandId) => {
      if (nextCommandToPlugin.has(commandId)) return;
      unsub();
      this.commandUnsubs.delete(commandId);
    });
    this.commandToPlugin = nextCommandToPlugin;
  }

  override dispose() {
    this.subscription?.unsubscribe();
    this.runtimeMap.forEach(runtime => runtime.stop());
    this.runtimeMap.clear();
    this.commandUnsubs.forEach(unsub => unsub());
    this.commandUnsubs.clear();
    this.commandToPlugin.clear();
    super.dispose();
  }
}
