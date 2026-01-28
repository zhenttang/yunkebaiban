import { NbstoreProvider } from '@yunke/core/modules/storage';
import { apis } from '@yunke/electron-api';
import { StoreManagerClient } from '@yunke/nbstore/worker/client';
import type { Framework } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { v4 as uuid } from 'uuid';

const WORKER_CONNECT_TIMEOUT_MS = 15000;

function createStoreManagerClient() {
  const { port1: portForOpClient, port2: portForWorker } = new MessageChannel();
  let portFromWorker: MessagePort | null = null;
  const portId = uuid();
  const ready = Promise.withResolvers<void>();

  const handleMessage = (ev: MessageEvent) => {
    if (
      ev.data.type === 'electron:worker-connect' &&
      ev.data.portId === portId
    ) {
      portFromWorker = ev.ports[0];
      // 连接portForWorker和portFromWorker
      portFromWorker.addEventListener('message', ev => {
        portForWorker.postMessage(ev.data, [...ev.ports]);
      });
      portForWorker.addEventListener('message', ev => {
        // oxlint-disable-next-line no-non-null-assertion
        portFromWorker!.postMessage(ev.data, [...ev.ports]);
      });
      portForWorker.start();
      portFromWorker.start();
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
      ready.resolve();
    }
  };

  const timeoutId = window.setTimeout(() => {
    window.removeEventListener('message', handleMessage);
    ready.reject(new Error(`Worker连接超时（${WORKER_CONNECT_TIMEOUT_MS}ms）`));
  }, WORKER_CONNECT_TIMEOUT_MS);

  window.addEventListener('message', handleMessage);

  // oxlint-disable-next-line no-non-null-assertion
  apis!.worker.connectWorker('yunke-shared-worker', portId).catch(err => {
    console.error('连接worker失败', err);
    window.clearTimeout(timeoutId);
    window.removeEventListener('message', handleMessage);
    ready.reject(err);
  });

  const storeManager = new StoreManagerClient(new OpClient(portForOpClient));
  portForOpClient.start();
  return { storeManager, ready: ready.promise };
}

export async function setupStoreManager(framework: Framework) {
  const { storeManager, ready } = createStoreManagerClient();
  await ready;
  window.addEventListener('beforeunload', () => {
    storeManager.dispose();
  });

  framework.impl(NbstoreProvider, {
    openStore(key, options) {
      const { store, dispose } = storeManager.open(key, options);

      return {
        store,
        dispose: () => {
          dispose();
        },
      };
    },
  });
}
