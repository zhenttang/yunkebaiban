// 🔥 性能优化：使用轻量级Worker Bootstrap替代完整浏览器Bootstrap
// 原因：完整bootstrap导致Worker文件膨胀到8.98MB
import '@yunke/core/bootstrap/worker';

import { broadcastChannelStorages } from '@yunke/nbstore/broadcast-channel';
// ⚠️ 移除 cloudStorages - Worker 不应该直接处理云存储
// import { cloudStorages } from '@yunke/nbstore/cloud';
import { idbStorages } from '@yunke/nbstore/idb';
import { idbV1Storages } from '@yunke/nbstore/idb/v1';
import { bindNativeDBApis, sqliteStorages } from '@yunke/nbstore/sqlite';
import {
  bindNativeDBV1Apis,
  sqliteV1Storages,
} from '@yunke/nbstore/sqlite/v1';
import {
  StoreManagerConsumer,
  type WorkerManagerOps,
} from '@yunke/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';
import {
  createFileNativeDBApis,
  createFileNativeDBV1Apis,
} from '@yunke/core/modules/storage/file-native-db';

// 检测是否在 Electron 开发模式下
// 在 Electron 开发模式下，渲染进程从 localhost:8080 加载，
// File System Access API 权限会在页面刷新后丢失，导致 "离线目录未授权" 错误
// 解决方案：在 Electron 开发模式下使用 IndexedDB 而不是 SQLite/File System API
const isElectronDevMode = (() => {
  try {
    // Worker 中使用 self.navigator 和 self.location
    const nav = typeof self !== 'undefined' && self.navigator;
    const loc = typeof self !== 'undefined' && self.location;
    const isElectron = nav && nav.userAgent && nav.userAgent.includes('Electron');
    const isLocalhost = loc && (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1');
    console.info('[nbstore.worker] 环境检测:', { isElectron, isLocalhost, userAgent: nav?.userAgent?.substring(0, 50) });
    return isElectron && isLocalhost;
  } catch (e) {
    console.warn('[nbstore.worker] 环境检测失败:', e);
    return false;
  }
})();

let storages: any[];

if (isElectronDevMode) {
  // Electron 开发模式：只使用 IndexedDB（避免 File System Access API 权限问题）
  console.info('[nbstore.worker] ✅ Electron 开发模式：使用 IndexedDB 存储');
  storages = [
    ...idbStorages,
    ...idbV1Storages,
    ...broadcastChannelStorages,
  ];
} else {
  // 其他模式：正常使用 SQLite + IndexedDB
  console.info('[nbstore.worker] 📦 标准模式：使用 SQLite + IndexedDB 存储');
  bindNativeDBApis(createFileNativeDBApis());
  bindNativeDBV1Apis(createFileNativeDBV1Apis());
  storages = [
    ...sqliteStorages,
    ...sqliteV1Storages,
    ...idbStorages,
    ...idbV1Storages,
    ...broadcastChannelStorages,
  ];
}

const consumer = new StoreManagerConsumer(storages);

if ('onconnect' in globalThis) {
  // if in shared worker

  (globalThis as any).onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
  };
} else {
  // if in worker
  consumer.bindConsumer(
    new OpConsumer<WorkerManagerOps>(globalThis as MessageCommunicapable)
  );
}
