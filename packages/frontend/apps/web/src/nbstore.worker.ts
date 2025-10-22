// 🔥 性能优化：使用轻量级Worker Bootstrap替代完整浏览器Bootstrap
// 原因：完整bootstrap导致Worker文件膨胀到8.98MB
import '@yunke/core/bootstrap/worker';

import { broadcastChannelStorages } from '@yunke/nbstore/broadcast-channel';
// ⚠️ 移除 cloudStorages - Worker 不应该直接处理云存储
// import { cloudStorages } from '@yunke/nbstore/cloud';
import { idbStorages } from '@yunke/nbstore/idb';
import { idbV1Storages } from '@yunke/nbstore/idb/v1';
import {
  StoreManagerConsumer,
  type WorkerManagerOps,
} from '@yunke/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';

const consumer = new StoreManagerConsumer([
  ...idbStorages,
  ...idbV1Storages,
  ...broadcastChannelStorages,
  // ...cloudStorages, // ⚠️ 云存储由主线程管理，Worker 只处理本地存储
]);

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
