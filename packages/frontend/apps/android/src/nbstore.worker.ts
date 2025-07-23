import './setup-worker';

import { broadcastChannelStorages } from '@affine/nbstore/broadcast-channel';
import {
  cloudStorages,
  configureSocketAuthMethod,
} from '@affine/nbstore/cloud';
import { idbStorages } from '@affine/nbstore/idb';
// SQLite相关导入已移除：Android使用纯Web方案
// import {
//   bindNativeDBApis,
//   type NativeDBApis,
//   sqliteStorages,
// } from '@affine/nbstore/sqlite';
import {
  StoreManagerConsumer,
  type WorkerManagerOps,
} from '@affine/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';
// AsyncCall 导入已移除：Android不再需要RPC调用原生API
// import { AsyncCall } from 'async-call-rpc';

import { readEndpointToken } from './proxy';

configureSocketAuthMethod((endpoint, cb) => {
  readEndpointToken(endpoint)
    .then(token => {
      cb({ token });
    })
    .catch(e => {
      console.error(e);
    });
});

// 原生数据库API绑定已禁用：Android使用纯Web方案
// globalThis.addEventListener('message', e => {
//   if (e.data.type === 'native-db-api-channel') {
//     const port = e.ports[0] as MessagePort;
//     const rpc = AsyncCall<NativeDBApis>(
//       {},
//       {
//         channel: {
//           on(listener) {
//             const f = (e: MessageEvent<any>) => {
//               listener(e.data);
//             };
//             port.addEventListener('message', f);
//             return () => {
//               port.removeEventListener('message', f);
//             };
//           },
//           send(data) {
//             port.postMessage(data);
//           },
//         },
//       }
//     );
//     bindNativeDBApis(rpc);
//     port.start();
//   }
// });

const consumer = new OpConsumer<WorkerManagerOps>(
  globalThis as MessageCommunicapable
);

// Android环境禁用SQLite存储，使用IndexedDB替代
const storeManager = new StoreManagerConsumer([
  ...idbStorages,
  ...broadcastChannelStorages,
  ...cloudStorages,
]);

storeManager.bindConsumer(consumer);
