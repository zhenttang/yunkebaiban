import { AsyncCall } from 'async-call-rpc';

import type { HelperToMain, MainToHelper } from '../shared/type';
import { exposed } from './provide';
import { logger } from './logger';

logger.info('[helper-rpc] Initializing main RPC channel');

const helperToMainServer: HelperToMain = {
  getMeta: () => {
    logger.info('[helper-rpc] getMeta called, exposed:', !!exposed);
    if (!exposed) {
      throw new Error('Helper is not initialized correctly');
    }
    return exposed;
  },
};

export const mainRPC = AsyncCall<MainToHelper>(helperToMainServer, {
  strict: {
    unknownMessage: false,
  },
  channel: {
    on(listener) {
      logger.info('[helper-rpc] Setting up message listener on parentPort');
      logger.info('[helper-rpc] parentPort exists:', !!process.parentPort);
      const f = (e: Electron.MessageEvent) => {
        // MessageEvent has .data property containing the actual message
        logger.info('[helper-rpc] Received message from main, data:', JSON.stringify(e?.data).slice(0, 100));
        listener(e.data);
      };
      process.parentPort.on('message', f);
      logger.info('[helper-rpc] Message listener registered');
      return () => {
        process.parentPort.off('message', f);
      };
    },
    send(data) {
      logger.info('[helper-rpc] Sending message to main:', JSON.stringify(data).slice(0, 100));
      process.parentPort.postMessage(data);
    },
  },
  log: false,
});

logger.info('[helper-rpc] Main RPC initialized');

// Test: add another listener to see if messages are received
process.parentPort.on('message', (e: Electron.MessageEvent) => {
  logger.info('[helper-rpc] TEST: Raw message received, channel:', e.data?.channel, 'data type:', typeof e.data);
});
