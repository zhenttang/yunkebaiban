import { join } from 'node:path';

import type { EventBasedChannel } from 'async-call-rpc';

export function getTime() {
  return Date.now();
}

export const isMacOS = () => {
  return process.platform === 'darwin';
};

export const isWindows = () => {
  return process.platform === 'win32';
};

export const isLinux = () => {
  return process.platform === 'linux';
};

interface MessagePortLike {
  postMessage: (data: unknown) => void;
  addListener: (event: 'message', listener: (...args: any[]) => void) => void;
  removeListener: (
    event: 'message',
    listener: (...args: any[]) => void
  ) => void;
}

export class MessageEventChannel implements EventBasedChannel {
  private static logEnabled = false;
  
  static enableLogging(logger: { info: (...args: any[]) => void }) {
    MessageEventChannel.logEnabled = true;
    MessageEventChannel.logger = logger;
  }
  
  private static logger: { info: (...args: any[]) => void } | null = null;
  
  private log(...args: any[]) {
    if (MessageEventChannel.logEnabled && MessageEventChannel.logger) {
      MessageEventChannel.logger.info('[MessageEventChannel]', ...args);
    }
  }
  
  constructor(private readonly worker: MessagePortLike) {
    this.log('Created');
  }

  on(listener: (data: unknown) => void) {
    this.log('Setting up listener');
    const f = (data: unknown) => {
      this.log('Received message, type:', typeof data);
      listener(data);
    };
    this.worker.addListener('message', f);
    this.log('Listener added');
    return () => {
      this.worker.removeListener('message', f);
    };
  }

  send(data: unknown) {
    this.log('Sending message');
    this.worker.postMessage(data);
    this.log('Message sent');
  }
}

// Use process.resourcesPath in production (provided by Electron packaged app)
// In development, __dirname will be in dist/, so we go up to find resources
// Detect packaged app by checking if resourcesPath contains 'app.asar' or if __dirname is inside asar
const isPackaged = process.resourcesPath?.includes('app.asar') || __dirname.includes('app.asar');
// In packaged app, process.resourcesPath points to app.asar/../resources (outside asar)
// In dev mode (via npx electron), it points to node_modules/electron/dist/resources which is wrong
export const resourcesPath = isPackaged 
  ? process.resourcesPath 
  : join(__dirname, `../resources`);

// credit: https://github.com/facebook/fbjs/blob/main/packages/fbjs/src/core/shallowEqual.js
export function shallowEqual<T>(objA: T, objB: T) {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key as keyof T], objB[key as keyof T])
    ) {
      return false;
    }
  }

  return true;
}
