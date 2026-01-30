import './setup-worker';

import { broadcastChannelStorages } from '@yunke/nbstore/broadcast-channel';
// 云存储模块条件加载：仅在启用云同步时才加载
// import {
//   cloudStorages,
//   configureSocketAuthMethod,
// } from '@yunke/nbstore/cloud';
import { idbStorages } from '@yunke/nbstore/idb';
import {
  StoreManagerConsumer,
  type WorkerManagerOps,
} from '@yunke/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';

// 🔧 Android 默认离线模式：不配置 Socket 认证，不加载云存储
// 这样可以避免首次启动时的网络请求超时卡顿
// configureSocketAuthMethod((endpoint, cb) => {
//   readEndpointToken(endpoint)
//     .then(token => {
//       cb({ token });
//     })
//     .catch(e => {
//       console.error(e);
//     });
// });

const consumer = new OpConsumer<WorkerManagerOps>(
  globalThis as MessageCommunicapable
);

// 🔧 Android 默认离线模式：仅使用本地存储
// IndexedDB + BroadcastChannel，不加载 cloudStorages
// 用户需要云同步时，可以在设置中配置外部存储（S3等）
const storeManager = new StoreManagerConsumer([
  ...idbStorages,              // IndexedDB 作为主要本地存储
  ...broadcastChannelStorages, // 跨 Tab 通信
  // 云存储已禁用，使用外部存储服务（S3）代替
]);

console.log('🔧 Android Worker 存储配置（离线模式）:', {
  storageTypes: ['IndexedDB', 'BroadcastChannel'],
  mode: 'offline-first',
  note: '云同步请使用设置中的外部存储功能'
});

storeManager.bindConsumer(consumer);
