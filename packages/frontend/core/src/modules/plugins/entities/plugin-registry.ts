import { Entity, LiveData } from '@toeverything/infra';

import type { GlobalStateService } from '../../storage';
import type {
  PluginInstallOptions,
  PluginManifest,
  PluginRecord,
} from '../types';

const REGISTRY_KEY = 'yunke:plugins:registry';

const DEMO_PLUGIN_MANIFEST: PluginManifest = {
  id: 'com.yunke.demo.quick-tag',
  name: '快速标签',
  version: '0.1.0',
  author: 'Yunke',
  entry: 'main.js',
  engine: {
    minVersion: '1.0.0',
    apiVersion: '1',
  },
  permissions: ['ui:toolbar', 'command:register', 'doc:read'],
  contributes: {
    toolbar: [
      {
        id: 'quick-tag',
        label: '快速标签',
        icon: 'tag',
        command: 'insert-tag',
        scope: 'page',
      },
    ],
    command: [
      {
        id: 'insert-tag',
        label: '插入标签',
      },
    ],
  },
};

const DEMO_PLUGIN_ENTRY_SOURCE = `
exports.activate = (ctx) => {
  ctx.ui.showToast('示例插件已启用');
  ctx.command.register({
    id: 'insert-tag',
    handler: () => ctx.ui.showToast('示例插件命令已执行'),
  });
};
`;

export class PluginRegistry extends Entity {
  private readonly globalState = this.globalStateService.globalState;

  plugins$ = LiveData.from<PluginRecord[]>(
    this.globalState.watch(REGISTRY_KEY),
    this.getAll()
  );

  constructor(private readonly globalStateService: GlobalStateService) {
    super();
    this.ensureRegistry();
  }

  private ensureRegistry() {
    const stored = this.globalState.get<PluginRecord[]>(REGISTRY_KEY);
    if (!stored) {
      this.globalState.set(REGISTRY_KEY, []);
    }
  }

  private setRegistry(next: PluginRecord[]) {
    this.globalState.set(REGISTRY_KEY, next);
  }

  getAll(): PluginRecord[] {
    return this.globalState.get<PluginRecord[]>(REGISTRY_KEY) ?? [];
  }

  getById(id: string): PluginRecord | null {
    return this.getAll().find(item => item.manifest.id === id) ?? null;
  }

  install(manifest: PluginManifest, options?: PluginInstallOptions) {
    const now = new Date().toISOString();
    const records = this.getAll();
    const existingIndex = records.findIndex(
      record => record.manifest.id === manifest.id
    );
    const record: PluginRecord = {
      manifest,
      enabled: options?.enabled ?? false,
      installedAt: existingIndex >= 0 ? records[existingIndex].installedAt : now,
      updatedAt: existingIndex >= 0 ? now : undefined,
      source: options?.source ?? 'local',
      entrySource: options?.entrySource ?? records[existingIndex]?.entrySource,
    };

    if (existingIndex >= 0) {
      const next = [...records];
      next[existingIndex] = record;
      this.setRegistry(next);
      return;
    }

    this.setRegistry([...records, record]);
  }

  uninstall(id: string) {
    const next = this.getAll().filter(item => item.manifest.id !== id);
    this.setRegistry(next);
  }

  setEnabled(id: string, enabled: boolean) {
    const records = this.getAll();
    const index = records.findIndex(item => item.manifest.id === id);
    if (index < 0) return;
    const record = records[index];
    if (record.enabled === enabled) return;

    const next = [...records];
    next[index] = {
      ...record,
      enabled,
      updatedAt: new Date().toISOString(),
    };
    this.setRegistry(next);
  }

  installDemoPlugin() {
    if (this.getById(DEMO_PLUGIN_MANIFEST.id)) {
      return;
    }
    this.install(DEMO_PLUGIN_MANIFEST, {
      enabled: false,
      source: 'builtin',
      entrySource: DEMO_PLUGIN_ENTRY_SOURCE,
    });
  }
}
