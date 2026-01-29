// Sentry preload 在 Electron sandbox 环境下会导致 sessionStorage 访问错误
// 完全禁用以确保应用正常启动
// import '@sentry/electron/preload';

import { contextBridge } from 'electron';

import { apis, appInfo, events } from './electron-api';
import { sharedStorage } from './shared-storage';
import { listenWorkerApis } from './worker';

contextBridge.exposeInMainWorld('__appInfo', appInfo);
contextBridge.exposeInMainWorld('__apis', apis);
contextBridge.exposeInMainWorld('__events', events);
contextBridge.exposeInMainWorld('__sharedStorage', sharedStorage);

listenWorkerApis();
