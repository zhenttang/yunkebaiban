import '@affine/core/bootstrap/electron';

import { apis } from '@affine/electron-api';
import { broadcastChannelStorages } from '@affine/nbstore/broadcast-channel';
import { cloudStorages } from '@affine/nbstore/cloud';
import { idbStoragesIndexerOnly } from '@affine/nbstore/idb';
import { bindNativeDBApis, sqliteStorages } from '@affine/nbstore/sqlite';
import {
  bindNativeDBV1Apis,
  sqliteV1Storages,
} from '@affine/nbstore/sqlite/v1';
import {
  StoreManagerConsumer,
  type WorkerManagerOps,
} from '@affine/nbstore/worker/consumer';
import { OpConsumer } from '@toeverything/infra/op';

// 检查APIs是否存在以及是否包含必要的属性
if (apis && apis.nbstore) {
  bindNativeDBApis(apis.nbstore);
} else {
      console.warn('当前环境中nbstore API不可用');
}

if (apis && apis.db) {
  bindNativeDBV1Apis(apis.db);
} else {
      console.warn('当前环境中数据库API不可用');
}

const storeManager = new StoreManagerConsumer([
  ...idbStoragesIndexerOnly,
  ...sqliteStorages,
  ...sqliteV1Storages,
  ...broadcastChannelStorages,
  ...cloudStorages,
]);

window.addEventListener('message', ev => {
  if (ev.data.type === 'electron:worker-connect') {
    const port = ev.ports[0];

    const consumer = new OpConsumer<WorkerManagerOps>(port);
    storeManager.bindConsumer(consumer);
  }
});
