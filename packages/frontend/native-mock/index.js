// Mock implementation of @yunke/native that delegates to Java backend APIs

// 统一从配置模块读取基础地址
// 注意：这个文件在运行时动态加载，需要异步获取配置
let BASE_URL = '';
let BASE_URL_PROMISE = null;
let fs = null;
let path = null;
let fsp = null;
try {
  fs = require('node:fs');
  path = require('node:path');
  fsp = fs.promises;
} catch {
  // ignore in non-node environments
}

const STORE_VERSION = 1;
const storeRegistry = new Map();

const isNodeRuntime =
  typeof process !== 'undefined' && !!process.versions?.node;

function ensureObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function createEmptyStore() {
  return {
    version: STORE_VERSION,
    docs: {},
    clocks: {},
    blobs: {},
    peerClocks: { remote: {}, pulled: {}, pushed: {} },
    blobUploadedAt: {},
    serverClock: {},
    syncMetadata: {},
    v1: {
      updates: [],
      blobs: {},
      serverClock: {},
      syncMetadata: {},
      version: 1,
      nextUpdateId: 1,
    },
  };
}

function normalizeStore(raw) {
  const base = createEmptyStore();
  if (!raw || typeof raw !== 'object') {
    return base;
  }

  const peerClocks = raw.peerClocks ?? {};
  const v1 = raw.v1 ?? {};

  return {
    version: typeof raw.version === 'number' ? raw.version : base.version,
    docs: ensureObject(raw.docs),
    clocks: ensureObject(raw.clocks),
    blobs: ensureObject(raw.blobs),
    peerClocks: {
      remote: ensureObject(peerClocks.remote),
      pulled: ensureObject(peerClocks.pulled),
      pushed: ensureObject(peerClocks.pushed),
    },
    blobUploadedAt: ensureObject(raw.blobUploadedAt),
    serverClock: ensureObject(raw.serverClock),
    syncMetadata: ensureObject(raw.syncMetadata),
    v1: {
      updates: Array.isArray(v1.updates) ? v1.updates : [],
      blobs: ensureObject(v1.blobs),
      serverClock: ensureObject(v1.serverClock),
      syncMetadata: ensureObject(v1.syncMetadata),
      version: typeof v1.version === 'number' ? v1.version : 1,
      nextUpdateId:
        typeof v1.nextUpdateId === 'number' ? v1.nextUpdateId : 1,
    },
  };
}

async function ensureDirForFile(filePath) {
  if (!fsp || !path) return;
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

async function fileExists(filePath) {
  if (!fsp) return false;
  try {
    await fsp.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFileHeader(filePath, length = 16) {
  if (!fsp) return '';
  try {
    const handle = await fsp.open(filePath, 'r');
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    await handle.close();
    return buffer.toString('utf8');
  } catch {
    return '';
  }
}

async function validateLocalStore(filePath) {
  if (!fsp) return false;
  if (!(await fileExists(filePath))) return false;
  const header = await readFileHeader(filePath);
  if (header.startsWith('SQLite format 3')) {
    return false;
  }
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object';
  } catch {
    return false;
  }
}

function isLocalStoreEnabled() {
  return isNodeRuntime && isElectronOfflineMode();
}

function base64ToUint8Array(base64) {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(uint8array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(uint8array).toString('base64');
  }
  let binary = '';
  const len = uint8array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8array[i]);
  }
  return btoa(binary);
}

class LocalStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.loaded = false;
    this.data = createEmptyStore();
    this.queue = Promise.resolve();
  }

  async load(createIfMissing = true) {
    if (this.loaded) return;
    if (!fsp) {
      throw new Error('Local storage unavailable');
    }
    await ensureDirForFile(this.filePath);
    if (await fileExists(this.filePath)) {
      const raw = await fsp.readFile(this.filePath, 'utf8');
      try {
        this.data = normalizeStore(JSON.parse(raw));
      } catch {
        const corruptPath = `${this.filePath}.corrupt`;
        await fsp.writeFile(corruptPath, raw);
        this.data = createEmptyStore();
      }
    } else if (createIfMissing) {
      this.data = createEmptyStore();
      await this.save();
    }
    this.loaded = true;
  }

  async save() {
    if (!fsp) return;
    await ensureDirForFile(this.filePath);
    await fsp.writeFile(this.filePath, JSON.stringify(this.data));
  }

  async withWrite(action) {
    const task = this.queue.then(async () => {
      await this.load(true);
      const result = await action(this.data);
      await this.save();
      return result;
    });
    this.queue = task.catch(() => {});
    return task;
  }

  async read() {
    await this.load(true);
    return this.data;
  }
}

function getStore(filePath) {
  if (!storeRegistry.has(filePath)) {
    storeRegistry.set(filePath, new LocalStore(filePath));
  }
  return storeRegistry.get(filePath);
}

function getDocState(data, docId) {
  if (!data.docs[docId] || typeof data.docs[docId] !== 'object') {
    data.docs[docId] = { updates: [] };
  }
  if (!Array.isArray(data.docs[docId].updates)) {
    data.docs[docId].updates = [];
  }
  return data.docs[docId];
}

function getPeerClockBucket(data, type, peer) {
  if (!data.peerClocks[type]) {
    data.peerClocks[type] = {};
  }
  if (!data.peerClocks[type][peer]) {
    data.peerClocks[type][peer] = {};
  }
  return data.peerClocks[type][peer];
}

function getBlobUploadedBucket(data, peer) {
  if (!data.blobUploadedAt[peer]) {
    data.blobUploadedAt[peer] = {};
  }
  return data.blobUploadedAt[peer];
}

function isElectronOfflineMode() {
  const apiBase = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : '';
  if (apiBase && apiBase.trim() !== '') {
    return false;
  }
  if (typeof process !== 'undefined' && process.versions?.electron) {
    return true;
  }
  return false;
}

function getBaseUrlSync() {
  // 如果已经初始化，直接返回
  if (BASE_URL) return BASE_URL;
  
  // 如果正在初始化，等待完成
  if (BASE_URL_PROMISE) {
    throw new Error('BASE_URL正在初始化中，请稍后重试');
  }
  
  // 首次调用，从环境变量读取（兼容性处理）
  // 优先尝试从统一配置模块获取（基于 ESM 的 import.meta）
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    BASE_URL = import.meta.env.VITE_API_BASE_URL;
    return BASE_URL;
  }
  
  // 回退到process.env（Node.js环境）
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
    BASE_URL = process.env.VITE_API_BASE_URL;
    return BASE_URL;
  }
  
  if (isElectronOfflineMode()) {
    return '';
  }
  
  throw new Error('❌ 环境变量配置缺失：请在 .env 文件中配置 VITE_API_BASE_URL');
}

// 获取JWT token
function getAuthToken() {
  if (typeof localStorage === 'undefined') return null;
  return (
    localStorage.getItem('yunke-admin-token') ||
    localStorage.getItem('yunke-access-token')
  );
}

// 创建带认证的fetch请求
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const baseUrl = getBaseUrlSync();
  if (!baseUrl) {
    throw new Error('离线模式下未配置 VITE_API_BASE_URL');
  }
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  return fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export class DocStorage {
  constructor(path) {
    this.path = path;
    this.workspaceId = null;
    console.log('[MOCK] DocStorage created at:', path);
  }
  
  async validate() {
    if (isLocalStoreEnabled()) {
      return await validateLocalStore(this.path);
    }
    console.log('[MOCK->JAVA] DocStorage.validate() - checking connection to Java backend');
    try {
      const response = await fetchWithAuth('/health');
      return response.ok;
    } catch (error) {
      console.error('[MOCK->JAVA] DocStorage validation failed:', error);
      return false;
    }
  }
  
  async setSpaceId(spaceId) {
    console.log('[MOCK] DocStorage.setSpaceId:', spaceId);
    this.workspaceId = spaceId;
  }
}

export class DocStoragePool {
  constructor() {
    this.connections = new Map();
    console.log('[MOCK] DocStoragePool created');
  }
  
  async connect(universalId, filePath) {
    if (isLocalStoreEnabled()) {
      const store = getStore(filePath);
      await store.load(true);
      this.connections.set(universalId, {
        path: filePath,
        workspaceId: universalId,
        store,
      });
      return;
    }
    this.connections.set(universalId, { path: filePath, workspaceId: universalId });
  }
  
  async disconnect(universalId) {
    this.connections.delete(universalId);
  }
  
  async checkpoint(universalId) {
    if (!isLocalStoreEnabled()) return;
    const connection = this.connections.get(universalId);
    if (connection?.store) {
      await connection.store.save();
    }
  }

  async setSpaceId(universalId, spaceId) {
    const connection = this.connections.get(universalId);
    if (connection) {
      connection.workspaceId = spaceId;
    }
  }

  getStoreForUniversal(universalId) {
    const connection = this.connections.get(universalId);
    if (!connection?.store) {
      throw new Error(`Storage not connected: ${universalId}`);
    }
    return connection.store;
  }
  
  async pushUpdate(universalId, docId, update) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const timestamp = await store.withWrite(data => {
        const doc = getDocState(data, docId);
        const existing = new Set(doc.updates.map(entry => entry.ts));
        let ts = Date.now();
        while (existing.has(ts)) {
          ts += 1;
        }
        doc.updates.push({
          ts,
          bin: uint8ArrayToBase64(update),
        });
        data.clocks[docId] = ts;
        return ts;
      });
      return new Date(timestamp);
    }
    try {
      const base64 = uint8ArrayToBase64(update);
      const response = await fetchWithAuth(
        `/api/workspaces/${universalId}/docs/${docId}/updates`,
        {
          method: 'POST',
          body: JSON.stringify({
            update: base64,
            timestamp: Date.now(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const ts = data && data.timestamp ? data.timestamp : Date.now();
        return new Date(ts);
      } else {
        console.error('[MOCK->JAVA] Failed to push update:', response.status);
        return new Date();
      }
    } catch (error) {
      console.error('[MOCK->JAVA] Error pushing update:', error);
      return new Date();
    }
  }
  
  async getDocSnapshot(universalId, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const doc = data.docs[docId];
      if (!doc?.snapshot) return null;
      return {
        docId,
        bin: base64ToUint8Array(doc.snapshot.bin),
        timestamp: new Date(doc.snapshot.ts),
      };
    }
    try {
      const response = await fetchWithAuth(
        `/api/workspaces/${universalId}/docs/${docId}`
      );

      if (response.ok) {
        const buf = await response.arrayBuffer();
        if (!buf || buf.byteLength === 0) return null;
        return new Uint8Array(buf);
      } else if (response.status === 404) {
        console.log('[MOCK->JAVA] Document not found, returning null');
        return null;
      } else {
        console.error('[MOCK->JAVA] Failed to get document:', response.status);
        return null;
      }
    } catch (error) {
      console.error('[MOCK->JAVA] Error getting document:', error);
      return null;
    }
  }
  
  async setDocSnapshot(universalId, snapshot) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      return await store.withWrite(data => {
        const doc = getDocState(data, snapshot.docId);
        const ts = snapshot.timestamp instanceof Date
          ? snapshot.timestamp.getTime()
          : new Date(snapshot.timestamp).getTime();
        if (!doc.snapshot || doc.snapshot.ts < ts) {
          doc.snapshot = {
            ts,
            bin: uint8ArrayToBase64(snapshot.bin),
          };
        }
        return true;
      });
    }
    try {
      return true;
    } catch (error) {
      console.error('[MOCK->JAVA] Error setting document snapshot:', error);
      return false;
    }
  }
  
  async getDocUpdates(universalId, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const doc = data.docs[docId];
      if (!doc?.updates?.length) return [];
      return doc.updates.map(update => ({
        docId,
        bin: base64ToUint8Array(update.bin),
        timestamp: new Date(update.ts),
      }));
    }
    console.warn('[MOCK] DocStoragePool.getDocUpdates:', universalId, docId);
    return [];
  }
  
  async markUpdatesMerged(universalId, docId, updates) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      return await store.withWrite(data => {
        const doc = getDocState(data, docId);
        if (!doc.updates.length) return 0;
        const toRemove = new Set(
          updates.map(item =>
            item instanceof Date ? item.getTime() : new Date(item).getTime()
          )
        );
        const before = doc.updates.length;
        doc.updates = doc.updates.filter(entry => !toRemove.has(entry.ts));
        return before - doc.updates.length;
      });
    }
    console.warn('[MOCK] DocStoragePool.markUpdatesMerged:', universalId, docId);
    return 0;
  }
  
  async deleteDoc(universalId, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        delete data.docs[docId];
        delete data.clocks[docId];
      });
      return;
    }
    console.warn('[MOCK] DocStoragePool.deleteDoc:', universalId, docId);
  }
  
  // 其他方法的模拟实现...
  async getDocClocks(universalId, after) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const afterMs = after ? after.getTime() : 0;
      return Object.entries(data.clocks)
        .filter(([, ts]) => typeof ts === 'number' && ts > afterMs)
        .map(([docId, ts]) => ({ docId, timestamp: new Date(ts) }));
    }
    return [];
  }

  async getDocClock(universalId, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const ts = data.clocks[docId];
      if (typeof ts !== 'number') return null;
      return { docId, timestamp: new Date(ts) };
    }
    return null;
  }

  async getBlob(universalId, key) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const blob = data.blobs[key];
      if (!blob) return null;
      return {
        key,
        data: base64ToUint8Array(blob.data),
        mime: blob.mime,
        size: blob.size,
        createdAt: new Date(blob.createdAt),
      };
    }
    return null;
  }

  async setBlob(universalId, blob) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const now = Date.now();
        data.blobs[blob.key] = {
          data: uint8ArrayToBase64(blob.data),
          mime: blob.mime,
          size: blob.data.length,
          createdAt: data.blobs[blob.key]?.createdAt ?? now,
        };
      });
      return;
    }
  }

  async deleteBlob(universalId, key) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        delete data.blobs[key];
      });
      return;
    }
  }

  async releaseBlobs() {
    return;
  }

  async listBlobs(universalId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      return Object.entries(data.blobs).map(([key, blob]) => ({
        key,
        size: blob.size,
        mime: blob.mime,
        createdAt: new Date(blob.createdAt),
      }));
    }
    return [];
  }

  async getPeerRemoteClocks(universalId, peer) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getPeerClockBucket(data, 'remote', peer);
      return Object.entries(bucket).map(([docId, ts]) => ({
        docId,
        timestamp: new Date(ts),
      }));
    }
    return [];
  }

  async getPeerRemoteClock(universalId, peer, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getPeerClockBucket(data, 'remote', peer);
      const ts = bucket[docId];
      if (typeof ts !== 'number') return null;
      return { docId, timestamp: new Date(ts) };
    }
    return null;
  }

  async setPeerRemoteClock(universalId, peer, docId, clock) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getPeerClockBucket(data, 'remote', peer);
        bucket[docId] = clock instanceof Date ? clock.getTime() : clock;
      });
      return;
    }
  }

  async getPeerPulledRemoteClocks(universalId, peer) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getPeerClockBucket(data, 'pulled', peer);
      return Object.entries(bucket).map(([docId, ts]) => ({
        docId,
        timestamp: new Date(ts),
      }));
    }
    return [];
  }

  async getPeerPulledRemoteClock(universalId, peer, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getPeerClockBucket(data, 'pulled', peer);
      const ts = bucket[docId];
      if (typeof ts !== 'number') return null;
      return { docId, timestamp: new Date(ts) };
    }
    return null;
  }

  async setPeerPulledRemoteClock(universalId, peer, docId, clock) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getPeerClockBucket(data, 'pulled', peer);
        bucket[docId] = clock instanceof Date ? clock.getTime() : clock;
      });
      return;
    }
  }

  async getPeerPushedClocks(universalId, peer) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getPeerClockBucket(data, 'pushed', peer);
      return Object.entries(bucket).map(([docId, ts]) => ({
        docId,
        timestamp: new Date(ts),
      }));
    }
    return [];
  }

  async getPeerPushedClock(universalId, peer, docId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getPeerClockBucket(data, 'pushed', peer);
      const ts = bucket[docId];
      if (typeof ts !== 'number') return null;
      return { docId, timestamp: new Date(ts) };
    }
    return null;
  }

  async setPeerPushedClock(universalId, peer, docId, clock) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getPeerClockBucket(data, 'pushed', peer);
        bucket[docId] = clock instanceof Date ? clock.getTime() : clock;
      });
      return;
    }
  }

  async clearClocks(universalId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        data.peerClocks = { remote: {}, pulled: {}, pushed: {} };
        data.blobUploadedAt = {};
      });
      return;
    }
  }

  async setBlobUploadedAt(universalId, peer, blobId, uploadedAt) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getBlobUploadedBucket(data, peer);
        bucket[blobId] =
          uploadedAt instanceof Date ? uploadedAt.getTime() : uploadedAt;
      });
      return;
    }
  }

  async getBlobUploadedAt(universalId, peer, blobId) {
    if (isLocalStoreEnabled()) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const bucket = getBlobUploadedBucket(data, peer);
      const ts = bucket[blobId];
      if (!ts) return null;
      return new Date(ts);
    }
    return null;
  }
}

export class SqliteConnection {
  constructor(path) {
    this.path = path;
    this.isClose = false;
    this.store = isNodeRuntime ? getStore(path) : null;
    console.warn('[MOCK] SqliteConnection created at:', path);
  }
  
  async connect() {
    if (this.store) {
      await this.store.load(true);
      return;
    }
    console.warn('[MOCK] SqliteConnection.connect');
  }
  
  static async validate(path) {
    if (!fsp) {
      return ValidationResult.GeneralError;
    }
    if (!(await fileExists(path))) {
      return ValidationResult.GeneralError;
    }
    const header = await readFileHeader(path);
    if (header.startsWith('SQLite format 3')) {
      return ValidationResult.Valid;
    }
    return ValidationResult.GeneralError;
  }
  
  async close() {
    this.isClose = true;
    console.warn('[MOCK] SqliteConnection.close');
  }
  
  // 其他方法的模拟实现...
  async addBlob(key, blob) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      const now = Date.now();
      data.v1.blobs[key] = {
        data: uint8ArrayToBase64(blob),
        ts: now,
      };
    });
  }

  async getBlob(key) {
    if (!this.store) return null;
    const data = await this.store.read();
    const row = data.v1.blobs[key];
    if (!row) return null;
    return {
      key,
      data: Buffer.from(row.data, 'base64'),
      timestamp: new Date(row.ts),
    };
  }

  async deleteBlob(key) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      delete data.v1.blobs[key];
    });
  }

  async getBlobKeys() {
    if (!this.store) return [];
    const data = await this.store.read();
    return Object.keys(data.v1.blobs);
  }

  async getUpdates(docId) {
    if (!this.store) return [];
    const data = await this.store.read();
    const updates = data.v1.updates.filter(update =>
      docId ? update.docId === docId : true
    );
    return updates.map(update => ({
      id: update.id,
      timestamp: new Date(update.ts),
      data: Buffer.from(update.data, 'base64'),
      docId: update.docId,
    }));
  }

  async getDocTimestamps() {
    if (!this.store) return [];
    const data = await this.store.read();
    const latest = new Map();
    data.v1.updates.forEach(update => {
      if (!update.docId) return;
      const prev = latest.get(update.docId);
      if (!prev || update.ts > prev) {
        latest.set(update.docId, update.ts);
      }
    });
    return Array.from(latest.entries()).map(([docId, ts]) => ({
      docId,
      timestamp: new Date(ts),
    }));
  }

  async deleteUpdates(docId) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      if (!docId) {
        data.v1.updates = [];
        return;
      }
      data.v1.updates = data.v1.updates.filter(update => update.docId !== docId);
    });
  }

  async getUpdatesCount(docId) {
    if (!this.store) return 0;
    const data = await this.store.read();
    if (!docId) return data.v1.updates.length;
    return data.v1.updates.filter(update => update.docId === docId).length;
  }

  async getAllUpdates() {
    if (!this.store) return [];
    const data = await this.store.read();
    return data.v1.updates.map(update => ({
      id: update.id,
      timestamp: new Date(update.ts),
      data: Buffer.from(update.data, 'base64'),
      docId: update.docId,
    }));
  }

  async insertUpdates(updates) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      updates.forEach(update => {
        const ts = Date.now();
        const id = data.v1.nextUpdateId++;
        data.v1.updates.push({
          id,
          docId: update.docId ?? null,
          ts,
          data: uint8ArrayToBase64(update.data),
        });
      });
    });
  }

  async replaceUpdates(docId, updates) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      if (docId) {
        data.v1.updates = data.v1.updates.filter(update => update.docId !== docId);
      } else {
        data.v1.updates = [];
      }
      updates.forEach(update => {
        const ts = Date.now();
        const id = data.v1.nextUpdateId++;
        data.v1.updates.push({
          id,
          docId: update.docId ?? docId ?? null,
          ts,
          data: uint8ArrayToBase64(update.data),
        });
      });
    });
  }

  async getServerClock(key) {
    if (!this.store) return null;
    const data = await this.store.read();
    const row = data.v1.serverClock[key];
    if (!row) return null;
    return {
      key,
      data: Buffer.from(row.data, 'base64'),
      timestamp: new Date(row.ts),
    };
  }

  async setServerClock(key, dataValue) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.serverClock[key] = {
        data: uint8ArrayToBase64(dataValue),
        ts: Date.now(),
      };
    });
  }

  async getServerClockKeys() {
    if (!this.store) return [];
    const data = await this.store.read();
    return Object.keys(data.v1.serverClock);
  }

  async clearServerClock() {
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.serverClock = {};
    });
  }

  async delServerClock(key) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      delete data.v1.serverClock[key];
    });
  }

  async getSyncMetadata(key) {
    if (!this.store) return null;
    const data = await this.store.read();
    const row = data.v1.syncMetadata[key];
    if (!row) return null;
    return {
      key,
      data: Buffer.from(row.data, 'base64'),
      timestamp: new Date(row.ts),
    };
  }

  async setSyncMetadata(key, dataValue) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.syncMetadata[key] = {
        data: uint8ArrayToBase64(dataValue),
        ts: Date.now(),
      };
    });
  }

  async getSyncMetadataKeys() {
    if (!this.store) return [];
    const data = await this.store.read();
    return Object.keys(data.v1.syncMetadata);
  }

  async clearSyncMetadata() {
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.syncMetadata = {};
    });
  }

  async delSyncMetadata(key) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      delete data.v1.syncMetadata[key];
    });
  }

  async initVersion() {
    if (!this.store) return;
    await this.store.withWrite(data => {
      if (!data.v1.version) {
        data.v1.version = 1;
      }
    });
  }

  async setVersion(version) {
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.version = version;
    });
  }

  async getMaxVersion() {
    if (!this.store) return 1;
    const data = await this.store.read();
    return data.v1.version ?? 1;
  }

  async migrateAddDocId() {
    return;
  }

  async checkpoint() {
    if (this.store) {
      await this.store.save();
    }
  }
}

export const ValidationResult = {
  MissingTables: 0,
  MissingDocIdColumn: 1,
  MissingVersionColumn: 2,
  GeneralError: 3,
  Valid: 4
};

export async function mintChallengeResponse(resource, bits = 20) {
  console.warn('[MOCK] mintChallengeResponse:', resource, bits);
  // 返回一个模拟的挑战响应
  return 'mock-challenge-response-' + Math.random().toString(36).substr(2, 9);
}

export async function verifyChallengeResponse(response, bits, resource) {
  console.warn('[MOCK] verifyChallengeResponse:', response, bits, resource);
  return true;
}

export async function decodeAudio(buf, destSampleRate, filename, signal) {
  console.warn('[MOCK] decodeAudio - returning empty Float32Array');
  return new Float32Array(0);
}

export function decodeAudioSync(buf, destSampleRate, filename) {
  console.warn('[MOCK] decodeAudioSync - returning empty Float32Array');
  return new Float32Array(0);
}

// 模拟其他导出的类和接口
export const ShareableContent = {
  // 模拟实现
};

export const AudioCaptureSession = class {
  // 模拟实现
};

export const TappableApplication = class {
  // 模拟实现
};

console.warn('🚧 [MOCK] @yunke/native loaded - Rust functionality disabled, using JavaScript mocks');
