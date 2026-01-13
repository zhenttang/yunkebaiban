import { NbstoreProvider } from '@yunke/core/modules/storage';
import { apis } from '@yunke/electron-api';
import { StoreManagerClient } from '@yunke/nbstore/worker/client';
import type { Framework } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { v4 as uuid } from 'uuid';

function createStoreManagerClient() {
  const { port1: portForOpClient, port2: portForWorker } = new MessageChannel();
  let portFromWorker: MessagePort | null = null;
  let portId = uuid();

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
    }
  };

  window.addEventListener('message', handleMessage);

  // oxlint-disable-next-line no-non-null-assertion
  apis!.worker.connectWorker('yunke-shared-worker', portId).catch(err => {
    console.error('连接worker失败', err);
  });

  const storeManager = new StoreManagerClient(new OpClient(portForOpClient));
  portForOpClient.start();
  return storeManager;
}

export function setupStoreManager(framework: Framework) {
  const storeManagerClient = createStoreManagerClient();
  window.addEventListener('beforeunload', () => {
    storeManagerClient.dispose();
  });

  framework.impl(NbstoreProvider, {
    openStore(key, options) {
      const { store, dispose } = storeManagerClient.open(key, options);

      return {
        store,
        dispose: () => {
          dispose();
        },
      };
    },
  });
}
