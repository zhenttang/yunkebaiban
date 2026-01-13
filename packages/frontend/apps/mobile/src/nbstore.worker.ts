// 🔥 性能优化：使用轻量级Worker Bootstrap
import '@yunke/core/bootstrap/worker';

import { broadcastChannelStorages } from '@yunke/nbstore/broadcast-channel';
import { cloudStorages } from '@yunke/nbstore/cloud';
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
  ...cloudStorages,
]);

if ('onconnect' in globalThis) {
  // 如果在共享worker中

  (globalThis as any).onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
  };
} else {
  // 如果在worker中
  consumer.bindConsumer(
    new OpConsumer<WorkerManagerOps>(globalThis as MessageCommunicapable)
  );
}
