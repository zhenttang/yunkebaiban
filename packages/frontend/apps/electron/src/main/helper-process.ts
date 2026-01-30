import path from 'node:path';

import type { _AsyncVersionOf } from 'async-call-rpc';
import { AsyncCall } from 'async-call-rpc';
import type {
  BaseWindow,
  OpenDialogOptions,
  SaveDialogOptions,
  UtilityProcess,
  WebContents,
} from 'electron';
import {
  app,
  dialog,
  MessageChannelMain,
  shell,
  utilityProcess,
} from 'electron';

import type { HelperToMain, MainToHelper } from '../shared/type';
import { MessageEventChannel } from '../shared/utils';
import { beforeAppQuit } from './cleanup';
import { logger } from './logger';

const HELPER_PROCESS_PATH = path.join(__dirname, './helper.js');

const isDev = process.env.NODE_ENV === 'development';

function pickAndBind<T extends object, U extends keyof T>(
  obj: T,
  keys: U[]
): { [K in U]: T[K] } {
  return keys.reduce((acc, key) => {
    const prop = obj[key];
    acc[key] = typeof prop === 'function' ? prop.bind(obj) : prop;
    return acc;
  }, {} as any);
}

class HelperProcessManager {
  ready: Promise<void>;
  private readonly _process: UtilityProcess;

  // a rpc server for the main process -> helper process
  rpc?: _AsyncVersionOf<HelperToMain>;

  static _instance: HelperProcessManager | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new HelperProcessManager();
    }
    return this._instance;
  }

  private constructor() {
    const helperProcess = utilityProcess.fork(HELPER_PROCESS_PATH, [], {
      // todo: port number should not being used
      execArgv: isDev ? ['--inspect=40894'] : [],
      serviceName: 'yunke-helper',
    });
    this._process = helperProcess;
    
    // Add event listeners to track process state
    helperProcess.on('exit', (code) => {
      logger.info('[helper] Process exited with code:', code);
    });
    
    helperProcess.on('message', (msg) => {
      logger.info('[helper] Received message from helper:', JSON.stringify(msg).slice(0, 100));
    });
    
    this.ready = new Promise((resolve, reject) => {
      helperProcess.once('spawn', () => {
        try {
          logger.info('[helper] forked', helperProcess.pid);
          logger.info('[helper] _process.pid after spawn:', this._process.pid);
          resolve();
        } catch (err) {
          logger.error('[helper] connectMain error', err);
          reject(err);
        }
      });
    });

    beforeAppQuit(() => {
      this._process.kill();
    });
  }

  // Get process reference (for debugging)
  getProcess() {
    logger.info('[helper] getProcess: _instance:', !!HelperProcessManager._instance, 'this:', !!this, '_process:', !!this._process);
    return this._process;
  }
  
  // Send test message (for debugging)  
  sendTestMessage() {
    logger.info('[helper] sendTestMessage: _instance:', !!HelperProcessManager._instance);
    logger.info('[helper] sendTestMessage: this._process:', !!this._process, 'pid:', this._process?.pid);
    if (this._process) {
      this._process.postMessage({ channel: 'test-message', data: 'hello from sendTestMessage' });
    } else {
      logger.error('[helper] sendTestMessage: _process is null/undefined!');
    }
  }

  // bridge renderer <-> helper process
  connectRenderer(renderer: WebContents) {
    // connect to the helper process
    const { port1: helperPort, port2: rendererPort } = new MessageChannelMain();
    this._process.postMessage({ channel: 'renderer-connect' }, [helperPort]);
    renderer.postMessage('helper-connection', null, [rendererPort]);

    return () => {
      try {
        helperPort.close();
        rendererPort.close();
      } catch (err) {
        logger.error('[helper] close port error', err);
      }
    };
  }

  // bridge main <-> helper process
  // also set up the RPC to the helper process
  connectMain(window: BaseWindow) {
    logger.info('[helper] connectMain called');
    logger.info('[helper] connectMain: process pid:', this._process?.pid, 'exists:', !!this._process);
    // Enable MessageEventChannel logging
    MessageEventChannel.enableLogging(logger);
    const helperProcess = this._process; // Capture reference
    logger.info('[helper] connectMain: helperProcess pid:', helperProcess?.pid, 'same as this._process:', helperProcess === this._process);
    const dialogMethods = {
      showOpenDialog: async (opts: OpenDialogOptions) => {
        return dialog.showOpenDialog(window, opts);
      },
      showSaveDialog: async (opts: SaveDialogOptions) => {
        return dialog.showSaveDialog(window, opts);
      },
    };
    const shellMethods = pickAndBind(shell, [
      'openExternal',
      'showItemInFolder',
      'openPath',
    ]);
    const appMethods = pickAndBind(app, ['getPath']);

    const mainToHelperServer: MainToHelper = {
      ...dialogMethods,
      ...shellMethods,
      ...appMethods,
    };

    this.rpc = AsyncCall<HelperToMain>(mainToHelperServer, {
      strict: {
        // the channel is shared for other purposes as well so that we do not want to
        // restrict to only JSONRPC messages
        unknownMessage: false,
      },
      channel: new MessageEventChannel(this._process),
      log: false,
    });
    logger.info('[helper] RPC initialized');
    
    // TEST: Send a test message directly to helper
    const savedPid = helperProcess?.pid;
    logger.info('[helper] Saved pid for later:', savedPid);
    
    setTimeout(() => {
      logger.info('[helper] Sending test message directly to helper process');
      // Access from instance again
      const currentProcess = HelperProcessManager.instance.getProcess();
      logger.info('[helper] Instance process pid:', currentProcess?.pid);
      logger.info('[helper] helperProcess (local var) pid:', helperProcess?.pid, 'saved pid:', savedPid);
      try {
        // Use instance method to send
        HelperProcessManager.instance.sendTestMessage();
        logger.info('[helper] Test message sent via instance');
      } catch (err) {
        logger.error('[helper] Failed to send test message:', err);
      }
    }, 1000);
  }
}

export async function ensureHelperProcess() {
  const helperProcessManager = HelperProcessManager.instance;
  await helperProcessManager.ready;
  return helperProcessManager;
}
