import { registerYunkeCommand } from '@yunke/core/commands';
import { OnEvent, Service } from '@toeverything/infra';

import { ApplicationStarted } from '../../lifecycle';
import { PluginRegistry } from '../entities/plugin-registry';
import type { PluginRecord } from '../types';
import { PluginRuntime } from '../runtime/plugin-runtime';

@OnEvent(ApplicationStarted, e => e.setupRuntime)
export class PluginRuntimeService extends Service {
  private runtimeMap = new Map<string, PluginRuntime>();
  private subscription?: { unsubscribe: () => void };
  private commandUnsubs = new Map<string, () => void>();
  private commandToPlugin = new Map<string, string>();

  private registry = this.framework.createEntity(PluginRegistry);

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

    records.forEach(record => {
      if (!record.enabled) return;
      if (this.runtimeMap.has(record.manifest.id)) return;
      const runtime = new PluginRuntime(record);
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
