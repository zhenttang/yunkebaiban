import { Service } from '@toeverything/infra';
import { strFromU8, unzipSync } from 'fflate';

import { PluginRegistry } from '../entities/plugin-registry';
import type { PluginInstallOptions, PluginManifest } from '../types';

// C-2 安全修复：ZIP 文件大小限制
const MAX_PLUGIN_ZIP_SIZE = 10 * 1024 * 1024; // 10MB

// C-3 安全修复：HTML 特殊字符转义
function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

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
    // C-2 安全修复：ZIP 文件大小限制
    if (file.size > MAX_PLUGIN_ZIP_SIZE) {
      throw new Error(`插件包过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，上限 ${MAX_PLUGIN_ZIP_SIZE / 1024 / 1024}MB`);
    }
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

    // C-2 安全修复：检查路径遍历攻击
    for (const p of paths) {
      const normalized = p.replace(/\\/g, '/');
      if (normalized.includes('..') || normalized.startsWith('/')) {
        throw new Error(`不安全的路径: ${p}`);
      }
    }

    const manifestPath = this.pickManifestPath(paths);
    if (!manifestPath) {
      throw new Error('未找到 manifest.json');
    }

    const manifestText = strFromU8(entries[manifestPath]);

    // C-2 安全修复：限制 manifest 文件大小（防止 JSON 解析 DoS）
    if (manifestText.length > 64 * 1024) {
      throw new Error('manifest.json 过大（超过 64KB）');
    }

    const rawManifest = JSON.parse(manifestText);

    // C-2 安全修复：严格校验 manifest 必填字段和类型
    if (typeof rawManifest !== 'object' || rawManifest === null) {
      throw new Error('manifest.json 格式无效');
    }
    if (typeof rawManifest.id !== 'string' || rawManifest.id.length === 0 || rawManifest.id.length > 128) {
      throw new Error('manifest.json 的 id 字段无效');
    }
    if (typeof rawManifest.name !== 'string' || rawManifest.name.length === 0 || rawManifest.name.length > 256) {
      throw new Error('manifest.json 的 name 字段无效');
    }
    if (typeof rawManifest.version !== 'string' || !/^\d+\.\d+\.\d+/.test(rawManifest.version)) {
      throw new Error('manifest.json 的 version 字段无效（需要 semver 格式）');
    }
    if (typeof rawManifest.entry !== 'string' || rawManifest.entry.length === 0) {
      throw new Error('manifest.json 的 entry 字段无效');
    }
    // C-2 安全修复：校验 permissions 字段
    if (rawManifest.permissions !== undefined) {
      if (!Array.isArray(rawManifest.permissions)) {
        throw new Error('manifest.json 的 permissions 字段必须是数组');
      }
      for (const perm of rawManifest.permissions) {
        if (typeof perm !== 'string') {
          throw new Error('manifest.json 的 permissions 中包含非字符串元素');
        }
      }
    }

    // C-3 安全修复：对 manifest 字符串字段进行 XSS 防护
    const manifest: PluginManifest = {
      ...rawManifest,
      id: rawManifest.id, // id 不做转义（内部使用）
      name: sanitizeString(rawManifest.name),
      version: rawManifest.version,
      entry: rawManifest.entry,
      description: rawManifest.description ? sanitizeString(rawManifest.description) : undefined,
      author: rawManifest.author ? sanitizeString(rawManifest.author) : undefined,
      permissions: rawManifest.permissions ?? [],
    };

    // C-2 安全修复：entry 路径不允许路径遍历
    if (manifest.entry.includes('..') || manifest.entry.startsWith('/')) {
      throw new Error(`不安全的入口路径: ${manifest.entry}`);
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
    const resolved = `${baseDir}${entry}`;
    // C-2 安全修复：确保解析后的路径不会逃逸
    if (resolved.includes('..')) {
      throw new Error(`入口路径遍历攻击: ${resolved}`);
    }
    return resolved;
  }
}
