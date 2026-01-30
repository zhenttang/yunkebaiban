import log from 'electron-log/main';

export const logger = log.scope('helper');

log.transports.file.level = 'info';
log.transports.console.level = 'info';

// Add global error handlers to catch any unhandled errors
process.on('uncaughtException', (error) => {
  logger.error('[helper] Uncaught exception:', error?.message, error?.stack);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[helper] Unhandled rejection:', reason);
});

// TEST: Add message listener at the very start
logger.info('[logger.ts] Setting up early message listener');
if (process.parentPort) {
  process.parentPort.on('message', (e: Electron.MessageEvent) => {
    logger.info('[logger.ts] EARLY: Received message, channel:', e.data?.channel, 'keys:', Object.keys(e.data || {}));
  });
  logger.info('[logger.ts] Early message listener registered');
} else {
  logger.warn('[logger.ts] parentPort is not available!');
}
