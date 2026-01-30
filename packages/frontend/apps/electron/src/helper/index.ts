import { AsyncCall } from 'async-call-rpc';

import type { RendererToHelper } from '../shared/type';
import { events, handlers } from './exposed';
import { logger } from './logger';
// Import main-rpc to set up RPC channel with main process
import './main-rpc';

function setupRendererConnection(rendererPort: Electron.MessagePortMain) {
  const flattenedHandlers = Object.entries(handlers).flatMap(
    ([namespace, namespaceHandlers]) => {
      return Object.entries(namespaceHandlers).map(([name, handler]) => {
        const handlerWithLog = async (...args: any[]) => {
          try {
            const start = performance.now();
            const result = await handler(...args);
            logger.debug(
              '[async-api]',
              `${namespace}.${name}`,
              args.filter(
                arg => typeof arg !== 'function' && typeof arg !== 'object'
              ),
              '-',
              (performance.now() - start).toFixed(2),
              'ms'
            );
            return result;
          } catch (error) {
            logger.error('[async-api]', `${namespace}.${name}`, error);
          }
        };
        return [`${namespace}:${name}`, handlerWithLog];
      });
    }
  );
  const rpc = AsyncCall<RendererToHelper>(
    Object.fromEntries(flattenedHandlers),
    {
      channel: {
        on(listener) {
          const f = (e: Electron.MessageEvent) => {
            listener(e.data);
          };
          rendererPort.on('message', f);
          // MUST start the connection to receive messages
          rendererPort.start();
          return () => {
            rendererPort.off('message', f);
          };
        },
        send(data) {
          rendererPort.postMessage(data);
        },
      },
      log: false,
    }
  );

  for (const [namespace, namespaceEvents] of Object.entries(events)) {
    for (const [key, eventRegister] of Object.entries(namespaceEvents)) {
      const unsub = eventRegister((...args: any[]) => {
        const chan = `${namespace}:${key}`;
        rpc.postEvent(chan, ...args).catch(err => {
          console.error(err);
        });
      });
      process.on('exit', () => {
        unsub();
      });
    }
  }
}

function main() {
  logger.info('[helper] main() starting, parentPort exists:', !!process.parentPort);
  
  process.parentPort.on('message', e => {
    logger.info('[helper] received message from main:', e.data?.channel || 'unknown');
    if (e.data.channel === 'renderer-connect' && e.ports.length === 1) {
      const rendererPort = e.ports[0];
      setupRendererConnection(rendererPort);
      logger.info('[helper] renderer connected');
    }
  });
  
  logger.info('[helper] main() initialized, waiting for messages');
}

logger.info('[helper] index.ts loaded, calling main()');
main();
logger.info('[helper] main() called');
