import { Service } from '@toeverything/infra';
import { strFromU8, unzipSync } from 'fflate';

import { PluginRegistry } from '../entities/plugin-registry';
import type { PluginInstallOptions, PluginManifest } from '../types';

export class PluginService extends Service {
  registry = this.framework.createEntity(PluginRegistry);

  constructor() {
    super();
    this.exposeDebug();
  }

  list() {
    return this.registry.getAll();
  }

  install(manifest: PluginManifest, options?: PluginInstallOptions) {
    this.registry.install(manifest, options);
  }

  async installFromZip(file: File) {
    const { manifest, entrySource } = await this.parsePluginZip(file);
    this.install(manifest, { source: 'local', enabled: false, entrySource });
    return manifest;
  }

  uninstall(id: string) {
    this.registry.uninstall(id);
  }

  enable(id: string) {
    this.registry.setEnabled(id, true);
  }

  disable(id: string) {
    this.registry.setEnabled(id, false);
  }

  installDemoPlugin() {
    this.registry.installDemoPlugin();
  }

  private exposeDebug() {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') return;

    (window as any).__PLUGIN_DEBUG__ = {
      list: () => this.list(),
      installDemo: () => this.installDemoPlugin(),
      installFromZip: (file: File) => this.installFromZip(file),
      enable: (id: string) => this.enable(id),
      disable: (id: string) => this.disable(id),
      uninstall: (id: string) => this.uninstall(id),
    };
  }

  private async parsePluginZip(file: File) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(buffer);
    const paths = Object.keys(entries).filter(
      path => !path.includes('__MACOSX') && !path.includes('DS_Store')
    );
    const manifestPath = this.pickManifestPath(paths);
    if (!manifestPath) {
      throw new Error('未找到 manifest.json');
    }

    const manifestText = strFromU8(entries[manifestPath]);
    const manifest = JSON.parse(manifestText) as PluginManifest;
    if (!manifest.id || !manifest.name || !manifest.version || !manifest.entry) {
      throw new Error('manifest.json 缺少必要字段');
    }

    const entryPath = this.resolveEntryPath(manifestPath, manifest.entry);
    const entryBuffer = entries[entryPath];
    if (!entryBuffer) {
      throw new Error(`未找到入口文件: ${entryPath}`);
    }
    const entrySource = strFromU8(entryBuffer);
    return { manifest, entrySource };
  }

  private pickManifestPath(paths: string[]) {
    const candidates = paths.filter(path => path.endsWith('manifest.json'));
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => a.length - b.length)[0];
  }

  private resolveEntryPath(manifestPath: string, entry: string) {
    if (!manifestPath.includes('/')) {
      return entry;
    }
    const baseDir = manifestPath.slice(0, manifestPath.lastIndexOf('/') + 1);
    return `${baseDir}${entry}`;
  }
}
