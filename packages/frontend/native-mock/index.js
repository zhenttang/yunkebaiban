// Mock implementation of @yunke/native that delegates to Java backend APIs

// Define isNodeRuntime early since it's needed for better-sqlite3 loading
const isNodeRuntime =
  typeof process !== 'undefined' && !!process.versions?.node;

// 统一从配置模块读取基础地址
// 注意：这个文件在运行时动态加载，需要异步获取配置
let BASE_URL = '';
let BASE_URL_PROMISE = null;
let fs = null;
let path = null;
let fsp = null;
let sqliteFactory = null;
let sqliteAvailable = false;
try {
  fs = require('node:fs');
  path = require('node:path');
  fsp = fs.promises;
} catch {
  // ignore in non-node environments
}
try {
  // In packaged Electron app, better-sqlite3 is in resources directory
  console.info('[MOCK] Attempting to load better-sqlite3, isNodeRuntime:', isNodeRuntime, 'resourcesPath:', process?.resourcesPath);
  if (isNodeRuntime && process?.resourcesPath) {
    const betterSqlitePath = require('node:path').join(process.resourcesPath, 'better-sqlite3');
    console.info('[MOCK] Trying to load from:', betterSqlitePath);
    try {
      // Add resources directory to module search paths for 'bindings' and other dependencies
      const Module = require('module');
      const resourcesPath = process.resourcesPath;
      // Add resources to global paths so require('bindings') can find it
      if (Module.globalPaths && !Module.globalPaths.includes(resourcesPath)) {
        Module.globalPaths.unshift(resourcesPath);
        console.info('[MOCK] Added resourcesPath to Module.globalPaths:', resourcesPath);
      }
      // Also try setting up custom resolution
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(id) {
        if (id === 'bindings' || id === 'file-uri-to-path') {
          const customPath = require('node:path').join(resourcesPath, id);
          try {
            return originalRequire.call(this, customPath);
          } catch (e) {
            // Fall through to original
          }
        }
        return originalRequire.call(this, id);
      };
      
      sqliteFactory = require(betterSqlitePath);
      sqliteAvailable = true;
      console.info('[MOCK] ✅ better-sqlite3 从 resources 加载成功:', betterSqlitePath);
    } catch (resourcesErr) {
      console.warn('[MOCK] Failed to load from resources:', resourcesErr?.message);
      console.warn('[MOCK] Stack:', resourcesErr?.stack);
      // Fallback to regular require
      sqliteFactory = require('better-sqlite3');
      sqliteAvailable = true;
      console.info('[MOCK] ✅ better-sqlite3 从 node_modules 加载成功');
    }
  } else {
    sqliteFactory = require('better-sqlite3');
    sqliteAvailable = true;
    console.info('[MOCK] ✅ better-sqlite3 加载成功');
  }
} catch (error) {
  console.warn(
    '[MOCK] ❌ better-sqlite3 未安装，离线模式将回退为 JSON 存储:',
    error?.message || error
  );
  console.warn('[MOCK] Stack trace:', error?.stack);
}

const STORE_VERSION = 1;
const storeRegistry = new Map();
const sqliteRegistry = new Map();
const SQLITE_SCHEMA_VERSION = 1;

// isNodeRuntime is defined at the top of the file

let offlineConfigCached = null;
let offlineConfigLoaded = false;

function canUseSqlite() {
  return isNodeRuntime && sqliteAvailable;
}

function getElectronUserDataPath() {
  if (!isNodeRuntime) return null;
  
  // 1. 尝试从环境变量获取（用于 helper 进程）
  if (process?.env?.YUNKE_USER_DATA_PATH) {
    return process.env.YUNKE_USER_DATA_PATH;
  }
  
  // 2. 尝试从 Electron API 获取
  try {
    const electron = require('electron');
    if (electron?.app?.getPath) {
      return electron.app.getPath('userData');
    }
    if (electron?.remote?.app?.getPath) {
      return electron.remote.app.getPath('userData');
    }
  } catch {
    // ignore
  }
  
  // 3. 回退：根据平台计算默认路径
  // 这对于 helper 进程很重要，因为它无法访问 electron.app
  try {
    const appName = process?.env?.YUNKE_APP_NAME || 'YUNKE-canary';
    if (process.platform === 'win32') {
      const appData = process.env.APPDATA;
      if (appData) {
        return path.join(appData, appName);
      }
    } else if (process.platform === 'darwin') {
      const home = process.env.HOME;
      if (home) {
        return path.join(home, 'Library', 'Application Support', appName);
      }
    } else {
      // Linux
      const home = process.env.HOME;
      const xdgConfig = process.env.XDG_CONFIG_HOME;
      if (xdgConfig) {
        return path.join(xdgConfig, appName);
      }
      if (home) {
        return path.join(home, '.config', appName);
      }
    }
  } catch {
    // ignore
  }
  
  return null;
}

function loadOfflineEnabledFromConfig() {
  if (offlineConfigLoaded) return offlineConfigCached;
  offlineConfigLoaded = true;
  if (!fs || !path || !isNodeRuntime) return null;
  try {
    const userDataPath = getElectronUserDataPath();
    if (!userDataPath) return null;
    const configPath = path.join(userDataPath, 'config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    const enabled = parsed?.offline?.enabled;
    offlineConfigCached = typeof enabled === 'boolean' ? enabled : null;
    if (offlineConfigCached !== null) {
      console.info('[MOCK] offline config detected', {
        enabled: offlineConfigCached,
        configPath,
      });
    }
  } catch (error) {
    console.warn('[MOCK] failed to read offline config', error?.message || error);
  }
  return offlineConfigCached;
}

function parsePeerFromUniversalId(universalId) {
  if (typeof universalId !== 'string') return null;
  const start = universalId.indexOf('@peer(');
  if (start === -1) return null;
  const end = universalId.indexOf(');', start);
  if (end === -1) return null;
  return universalId.slice(start + 6, end);
}

function isLocalPeer(peer) {
  return peer === 'local' || peer === 'deleted-local';
}

function shouldUseLocalStoreForUniversal(universalId) {
  const peer = parsePeerFromUniversalId(universalId);
  if (peer && isLocalPeer(peer)) return true;
  return isLocalStoreEnabled();
}

function shouldUseDocStorageSqlite(universalId) {
  const useLocal = shouldUseLocalStoreForUniversal(universalId);
  const canSqlite = canUseSqlite();
  const result = useLocal && canSqlite;
  console.info('[MOCK] shouldUseDocStorageSqlite:', {
    universalId: universalId?.substring(0, 50),
    useLocal,
    canSqlite,
    result,
    sqliteAvailable,
    isNodeRuntime,
  });
  return result;
}

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
    return true;
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

function toBuffer(data) {
  if (typeof Buffer === 'undefined') {
    return data;
  }
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

function base64ToBuffer(base64) {
  if (typeof Buffer === 'undefined') {
    return base64ToUint8Array(base64);
  }
  return Buffer.from(base64, 'base64');
}

async function getAvailableBackupPath(filePath, suffix) {
  if (!fsp) return `${filePath}${suffix}`;
  let candidate = `${filePath}${suffix}`;
  let index = 1;
  while (await fileExists(candidate)) {
    candidate = `${filePath}${suffix}.${index}`;
    index += 1;
  }
  return candidate;
}

async function moveFile(sourcePath, targetPath) {
  if (!fsp) return;
  try {
    await fsp.rename(sourcePath, targetPath);
  } catch {
    await fsp.copyFile(sourcePath, targetPath);
    await fsp.unlink(sourcePath);
  }
}

function initSqliteSchema(db) {
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS doc_updates (
      doc_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      bin BLOB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_doc_updates_doc ON doc_updates(doc_id);
    CREATE INDEX IF NOT EXISTS idx_doc_updates_doc_ts ON doc_updates(doc_id, ts);
    CREATE TABLE IF NOT EXISTS doc_snapshots (
      doc_id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      bin BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS doc_clocks (
      doc_id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS blobs (
      key TEXT PRIMARY KEY,
      data BLOB NOT NULL,
      mime TEXT,
      size INTEGER,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS peer_clocks (
      peer TEXT NOT NULL,
      type TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      PRIMARY KEY (peer, type, doc_id)
    );
    CREATE TABLE IF NOT EXISTS blob_uploaded_at (
      peer TEXT NOT NULL,
      blob_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      PRIMARY KEY (peer, blob_id)
    );
    CREATE TABLE IF NOT EXISTS v1_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_v1_updates_doc ON v1_updates(doc_id);
    CREATE TABLE IF NOT EXISTS v1_blobs (
      key TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS v1_server_clock (
      key TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS v1_sync_metadata (
      key TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS v1_meta (
      key TEXT PRIMARY KEY,
      value INTEGER
    );
  `);
  const upsertMeta = db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  upsertMeta.run('schema_version', String(SQLITE_SCHEMA_VERSION));
}

function createSqliteStatements(db) {
  return {
    getMaxDocUpdateTs: db.prepare(
      'SELECT MAX(ts) AS ts FROM doc_updates WHERE doc_id=?'
    ),
    insertDocUpdate: db.prepare(
      'INSERT INTO doc_updates (doc_id, ts, bin) VALUES (?, ?, ?)'
    ),
    upsertDocClock: db.prepare(
      'INSERT INTO doc_clocks (doc_id, ts) VALUES (?, ?) ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts'
    ),
    getDocSnapshot: db.prepare(
      'SELECT ts, bin FROM doc_snapshots WHERE doc_id=?'
    ),
    upsertDocSnapshot: db.prepare(
      `INSERT INTO doc_snapshots (doc_id, ts, bin)
       VALUES (?, ?, ?)
       ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts, bin=excluded.bin
       WHERE excluded.ts >= doc_snapshots.ts`
    ),
    getDocUpdates: db.prepare(
      'SELECT ts, bin FROM doc_updates WHERE doc_id=? ORDER BY ts ASC'
    ),
    deleteDocUpdatesByDoc: db.prepare(
      'DELETE FROM doc_updates WHERE doc_id=?'
    ),
    deleteDocSnapshot: db.prepare(
      'DELETE FROM doc_snapshots WHERE doc_id=?'
    ),
    deleteDocClock: db.prepare(
      'DELETE FROM doc_clocks WHERE doc_id=?'
    ),
    getDocClocksAfter: db.prepare(
      'SELECT doc_id AS docId, ts FROM doc_clocks WHERE ts > ?'
    ),
    getDocClock: db.prepare(
      'SELECT ts FROM doc_clocks WHERE doc_id=?'
    ),
    getBlob: db.prepare(
      'SELECT data, mime, size, created_at FROM blobs WHERE key=?'
    ),
    getBlobMeta: db.prepare('SELECT created_at FROM blobs WHERE key=?'),
    upsertBlob: db.prepare(
      `INSERT INTO blobs (key, data, mime, size, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET data=excluded.data, mime=excluded.mime, size=excluded.size, created_at=blobs.created_at`
    ),
    deleteBlob: db.prepare('DELETE FROM blobs WHERE key=?'),
    listBlobs: db.prepare(
      'SELECT key, size, mime, created_at FROM blobs'
    ),
    getPeerClocks: db.prepare(
      'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?'
    ),
    getPeerClock: db.prepare(
      'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?'
    ),
    upsertPeerClock: db.prepare(
      `INSERT INTO peer_clocks (peer, type, doc_id, ts)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`
    ),
    deletePeerClocks: db.prepare('DELETE FROM peer_clocks'),
    upsertBlobUploadedAt: db.prepare(
      `INSERT INTO blob_uploaded_at (peer, blob_id, ts)
       VALUES (?, ?, ?)
       ON CONFLICT(peer, blob_id) DO UPDATE SET ts=excluded.ts`
    ),
    getBlobUploadedAt: db.prepare(
      'SELECT ts FROM blob_uploaded_at WHERE peer=? AND blob_id=?'
    ),
    deleteBlobUploadedAt: db.prepare('DELETE FROM blob_uploaded_at'),
    addV1Blob: db.prepare(
      `INSERT INTO v1_blobs (key, ts, data)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, data=excluded.data`
    ),
    getV1Blob: db.prepare(
      'SELECT data, ts FROM v1_blobs WHERE key=?'
    ),
    deleteV1Blob: db.prepare('DELETE FROM v1_blobs WHERE key=?'),
    getV1BlobKeys: db.prepare('SELECT key FROM v1_blobs'),
    getV1UpdatesAll: db.prepare(
      'SELECT id, ts, data, doc_id AS docId FROM v1_updates ORDER BY id ASC'
    ),
    getV1UpdatesByDoc: db.prepare(
      'SELECT id, ts, data, doc_id AS docId FROM v1_updates WHERE doc_id IS ? ORDER BY id ASC'
    ),
    deleteV1UpdatesByDoc: db.prepare(
      'DELETE FROM v1_updates WHERE doc_id IS ?'
    ),
    deleteV1UpdatesAll: db.prepare('DELETE FROM v1_updates'),
    getV1UpdatesCountAll: db.prepare(
      'SELECT COUNT(1) AS count FROM v1_updates'
    ),
    getV1UpdatesCountByDoc: db.prepare(
      'SELECT COUNT(1) AS count FROM v1_updates WHERE doc_id IS ?'
    ),
    insertV1Update: db.prepare(
      'INSERT INTO v1_updates (doc_id, ts, data) VALUES (?, ?, ?)'
    ),
    insertV1UpdateWithId: db.prepare(
      'INSERT INTO v1_updates (id, doc_id, ts, data) VALUES (?, ?, ?, ?)'
    ),
    getV1DocTimestamps: db.prepare(
      'SELECT doc_id AS docId, MAX(ts) AS ts FROM v1_updates WHERE doc_id IS NOT NULL GROUP BY doc_id'
    ),
    getV1ServerClock: db.prepare(
      'SELECT data, ts FROM v1_server_clock WHERE key=?'
    ),
    setV1ServerClock: db.prepare(
      `INSERT INTO v1_server_clock (key, ts, data)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, data=excluded.data`
    ),
    getV1ServerClockKeys: db.prepare(
      'SELECT key FROM v1_server_clock'
    ),
    clearV1ServerClock: db.prepare('DELETE FROM v1_server_clock'),
    delV1ServerClock: db.prepare('DELETE FROM v1_server_clock WHERE key=?'),
    getV1SyncMetadata: db.prepare(
      'SELECT data, ts FROM v1_sync_metadata WHERE key=?'
    ),
    setV1SyncMetadata: db.prepare(
      `INSERT INTO v1_sync_metadata (key, ts, data)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET ts=excluded.ts, data=excluded.data`
    ),
    getV1SyncMetadataKeys: db.prepare(
      'SELECT key FROM v1_sync_metadata'
    ),
    clearV1SyncMetadata: db.prepare('DELETE FROM v1_sync_metadata'),
    delV1SyncMetadata: db.prepare('DELETE FROM v1_sync_metadata WHERE key=?'),
    getV1Version: db.prepare(
      'SELECT value FROM v1_meta WHERE key=?'
    ),
    setV1Version: db.prepare(
      `INSERT INTO v1_meta (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ),
  };
}

function importJsonToSqlite(db, store) {
  const statements = createSqliteStatements(db);
  const runImport = db.transaction(() => {
    for (const [docId, doc] of Object.entries(store.docs)) {
      if (doc?.snapshot) {
        statements.upsertDocSnapshot.run(
          docId,
          doc.snapshot.ts,
          base64ToBuffer(doc.snapshot.bin)
        );
      }
      if (Array.isArray(doc?.updates)) {
        doc.updates.forEach(update => {
          statements.insertDocUpdate.run(
            docId,
            update.ts,
            base64ToBuffer(update.bin)
          );
        });
      }
    }

    for (const [docId, ts] of Object.entries(store.clocks)) {
      if (typeof ts === 'number') {
        statements.upsertDocClock.run(docId, ts);
      }
    }

    for (const [key, blob] of Object.entries(store.blobs)) {
      if (!blob?.data) continue;
      statements.upsertBlob.run(
        key,
        base64ToBuffer(blob.data),
        blob.mime ?? null,
        blob.size ?? base64ToBuffer(blob.data).length,
        blob.createdAt ?? Date.now()
      );
    }

    for (const [peer, clocks] of Object.entries(store.peerClocks.remote)) {
      for (const [docId, ts] of Object.entries(clocks)) {
        if (typeof ts === 'number') {
          statements.upsertPeerClock.run(peer, 'remote', docId, ts);
        }
      }
    }
    for (const [peer, clocks] of Object.entries(store.peerClocks.pulled)) {
      for (const [docId, ts] of Object.entries(clocks)) {
        if (typeof ts === 'number') {
          statements.upsertPeerClock.run(peer, 'pulled', docId, ts);
        }
      }
    }
    for (const [peer, clocks] of Object.entries(store.peerClocks.pushed)) {
      for (const [docId, ts] of Object.entries(clocks)) {
        if (typeof ts === 'number') {
          statements.upsertPeerClock.run(peer, 'pushed', docId, ts);
        }
      }
    }

    for (const [peer, entries] of Object.entries(store.blobUploadedAt)) {
      for (const [blobId, ts] of Object.entries(entries)) {
        if (typeof ts === 'number') {
          statements.upsertBlobUploadedAt.run(peer, blobId, ts);
        }
      }
    }

    store.v1.updates.forEach(update => {
      statements.insertV1UpdateWithId.run(
        update.id,
        update.docId ?? null,
        update.ts,
        base64ToBuffer(update.data)
      );
    });

    for (const [key, blob] of Object.entries(store.v1.blobs)) {
      statements.addV1Blob.run(
        key,
        blob.ts ?? Date.now(),
        base64ToBuffer(blob.data)
      );
    }

    for (const [key, clock] of Object.entries(store.v1.serverClock)) {
      statements.setV1ServerClock.run(
        key,
        clock.ts ?? Date.now(),
        base64ToBuffer(clock.data)
      );
    }

    for (const [key, metadata] of Object.entries(store.v1.syncMetadata)) {
      statements.setV1SyncMetadata.run(
        key,
        metadata.ts ?? Date.now(),
        base64ToBuffer(metadata.data)
      );
    }

    statements.setV1Version.run('version', store.v1.version ?? 1);
  });

  runImport();
}

async function openSqliteEntry(filePath) {
  console.info('[MOCK] openSqliteEntry 开始:', { filePath, sqliteFactory: !!sqliteFactory, fsp: !!fsp });
  if (!sqliteFactory || !fsp) {
    console.error('[MOCK] openSqliteEntry 失败: SQLite runtime unavailable');
    throw new Error('SQLite runtime unavailable');
  }
  await ensureDirForFile(filePath);
  console.info('[MOCK] openSqliteEntry 目录已创建:', { filePath });

  let pendingStore = null;
  if (await fileExists(filePath)) {
    const header = await readFileHeader(filePath);
    if (!header.startsWith('SQLite format 3')) {
      try {
        const raw = await fsp.readFile(filePath, 'utf8');
        pendingStore = normalizeStore(JSON.parse(raw));
        const backupPath = await getAvailableBackupPath(filePath, '.json.bak');
        await moveFile(filePath, backupPath);
      } catch {
        const corruptPath = await getAvailableBackupPath(
          filePath,
          '.corrupt'
        );
        await moveFile(filePath, corruptPath);
      }
    }
  }

  console.info('[MOCK] openSqliteEntry 创建 SQLite 数据库:', { filePath });
  const db = new sqliteFactory(filePath);
  initSqliteSchema(db);
  if (pendingStore) {
    importJsonToSqlite(db, pendingStore);
  }
  console.info('[MOCK] openSqliteEntry ✅ 完成:', { filePath });
  return {
    db,
    statements: createSqliteStatements(db),
    refs: 0,
  };
}

async function acquireSqliteEntry(filePath) {
  if (!sqliteRegistry.has(filePath)) {
    sqliteRegistry.set(filePath, await openSqliteEntry(filePath));
  }
  const entry = sqliteRegistry.get(filePath);
  entry.refs += 1;
  return entry;
}

function releaseSqliteEntry(filePath) {
  const entry = sqliteRegistry.get(filePath);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.db.close();
    sqliteRegistry.delete(filePath);
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
  if (process?.env?.YUNKE_OFFLINE_MODE === '1') {
    return true;
  }
  const offlineEnabled = loadOfflineEnabledFromConfig();
  if (offlineEnabled === true) {
    return true;
  }
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
    if (await validateLocalStore(this.path)) {
      return true;
    }
    if (isLocalStoreEnabled()) {
      return false;
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
    const useSqlite = shouldUseDocStorageSqlite(universalId);
    const useLocal = shouldUseLocalStoreForUniversal(universalId);
    
    if (useSqlite) {
      const sqlite = await acquireSqliteEntry(filePath);
      this.connections.set(universalId, {
        path: filePath,
        workspaceId: universalId,
        sqlite,
      });
      console.info('[MOCK] DocStoragePool.connect sqlite', {
        universalId,
        filePath,
      });
      return;
    }
    if (useLocal) {
      const store = getStore(filePath);
      await store.load(true);
      this.connections.set(universalId, {
        path: filePath,
        workspaceId: universalId,
        store,
      });
      console.info('[MOCK] DocStoragePool.connect json', {
        universalId,
        filePath,
      });
      return;
    }
    this.connections.set(universalId, {
      path: filePath,
      workspaceId: universalId,
    });
    console.info('[MOCK] DocStoragePool.connect remote', {
      universalId,
      filePath,
    });
  }
  
  async disconnect(universalId) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      releaseSqliteEntry(connection.path);
    }
    this.connections.delete(universalId);
  }
  
  async checkpoint(universalId) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      connection.sqlite.db.pragma('wal_checkpoint(TRUNCATE)');
      return;
    }
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

  getSqliteForUniversal(universalId) {
    const connection = this.connections.get(universalId);
    if (!connection?.sqlite) {
      throw new Error(`SQLite not connected: ${universalId}`);
    }
    return connection.sqlite;
  }
  
  async pushUpdate(universalId, docId, update) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const now = Date.now();
      const row = statements.getMaxDocUpdateTs.get(docId);
      const ts = row?.ts ? Math.max(now, row.ts + 1) : now;
      statements.insertDocUpdate.run(docId, ts, toBuffer(update));
      statements.upsertDocClock.run(docId, ts);
      return new Date(ts);
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getDocSnapshot.get(docId);
      if (!row) return null;
      return {
        docId,
        bin: new Uint8Array(row.bin),
        timestamp: new Date(row.ts),
      };
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const ts =
        snapshot.timestamp instanceof Date
          ? snapshot.timestamp.getTime()
          : new Date(snapshot.timestamp).getTime();
      statements.upsertDocSnapshot.run(
        snapshot.docId,
        ts,
        toBuffer(snapshot.bin)
      );
      return true;
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const rows = statements.getDocUpdates.all(docId);
      return rows.map(row => ({
        docId,
        bin: new Uint8Array(row.bin),
        timestamp: new Date(row.ts),
      }));
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { db } = this.getSqliteForUniversal(universalId);
      const timestamps = updates
        .map(item =>
          item instanceof Date ? item.getTime() : new Date(item).getTime()
        )
        .filter(ts => Number.isFinite(ts));
      if (!timestamps.length) return 0;
      const placeholders = timestamps.map(() => '?').join(',');
      const stmt = db.prepare(
        `DELETE FROM doc_updates WHERE doc_id=? AND ts IN (${placeholders})`
      );
      const info = stmt.run(docId, ...timestamps);
      return info.changes || 0;
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { db, statements } = this.getSqliteForUniversal(universalId);
      const tx = db.transaction(() => {
        statements.deleteDocUpdatesByDoc.run(docId);
        statements.deleteDocSnapshot.run(docId);
        statements.deleteDocClock.run(docId);
      });
      tx();
      return;
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const afterMs = after ? after.getTime() : 0;
      const rows = statements.getDocClocksAfter.all(afterMs);
      return rows.map(row => ({
        docId: row.docId,
        timestamp: new Date(row.ts),
      }));
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getDocClock.get(docId);
      if (!row) return null;
      return { docId, timestamp: new Date(row.ts) };
    }
    if (connection?.store) {
      const store = this.getStoreForUniversal(universalId);
      const data = await store.read();
      const ts = data.clocks[docId];
      if (typeof ts !== 'number') return null;
      return { docId, timestamp: new Date(ts) };
    }
    return null;
  }

  async getBlob(universalId, key) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getBlob.get(key);
      if (!row) return null;
      return {
        key,
        data: new Uint8Array(row.data),
        mime: row.mime ?? '',
        size: row.size ?? row.data?.length ?? 0,
        createdAt: new Date(row.created_at),
      };
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const existing = statements.getBlobMeta.get(blob.key);
      const createdAt =
        existing?.created_at ?? Date.now();
      statements.upsertBlob.run(
        blob.key,
        toBuffer(blob.data),
        blob.mime,
        blob.data.length,
        createdAt
      );
      return;
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      statements.deleteBlob.run(key);
      return;
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const rows = statements.listBlobs.all();
      return rows.map(row => ({
        key: row.key,
        size: row.size ?? 0,
        mime: row.mime ?? '',
        createdAt: new Date(row.created_at),
      }));
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const rows = statements.getPeerClocks.all(peer, 'remote');
      return rows.map(row => ({
        docId: row.docId,
        timestamp: new Date(row.ts),
      }));
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getPeerClock.get(peer, 'remote', docId);
      if (!row) return null;
      return { docId, timestamp: new Date(row.ts) };
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const ts = clock instanceof Date ? clock.getTime() : clock;
      statements.upsertPeerClock.run(peer, 'remote', docId, ts);
      return;
    }
    if (connection?.store) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getPeerClockBucket(data, 'remote', peer);
        bucket[docId] = clock instanceof Date ? clock.getTime() : clock;
      });
      return;
    }
  }

  async getPeerPulledRemoteClocks(universalId, peer) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const rows = statements.getPeerClocks.all(peer, 'pulled');
      return rows.map(row => ({
        docId: row.docId,
        timestamp: new Date(row.ts),
      }));
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getPeerClock.get(peer, 'pulled', docId);
      if (!row) return null;
      return { docId, timestamp: new Date(row.ts) };
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const ts = clock instanceof Date ? clock.getTime() : clock;
      statements.upsertPeerClock.run(peer, 'pulled', docId, ts);
      return;
    }
    if (connection?.store) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getPeerClockBucket(data, 'pulled', peer);
        bucket[docId] = clock instanceof Date ? clock.getTime() : clock;
      });
      return;
    }
  }

  async getPeerPushedClocks(universalId, peer) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const rows = statements.getPeerClocks.all(peer, 'pushed');
      return rows.map(row => ({
        docId: row.docId,
        timestamp: new Date(row.ts),
      }));
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getPeerClock.get(peer, 'pushed', docId);
      if (!row) return null;
      return { docId, timestamp: new Date(row.ts) };
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const ts = clock instanceof Date ? clock.getTime() : clock;
      statements.upsertPeerClock.run(peer, 'pushed', docId, ts);
      return;
    }
    if (connection?.store) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        const bucket = getPeerClockBucket(data, 'pushed', peer);
        bucket[docId] = clock instanceof Date ? clock.getTime() : clock;
      });
      return;
    }
  }

  async clearClocks(universalId) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      statements.deletePeerClocks.run();
      statements.deleteBlobUploadedAt.run();
      return;
    }
    if (connection?.store) {
      const store = this.getStoreForUniversal(universalId);
      await store.withWrite(data => {
        data.peerClocks = { remote: {}, pulled: {}, pushed: {} };
        data.blobUploadedAt = {};
      });
      return;
    }
  }

  async setBlobUploadedAt(universalId, peer, blobId, uploadedAt) {
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const ts = uploadedAt instanceof Date ? uploadedAt.getTime() : uploadedAt;
      statements.upsertBlobUploadedAt.run(peer, blobId, ts);
      return;
    }
    if (connection?.store) {
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
    const connection = this.connections.get(universalId);
    if (connection?.sqlite) {
      const { statements } = this.getSqliteForUniversal(universalId);
      const row = statements.getBlobUploadedAt.get(peer, blobId);
      if (!row) return null;
      return new Date(row.ts);
    }
    if (connection?.store) {
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
    this.sqlite = null;
    console.warn('[MOCK] SqliteConnection created at:', path);
  }
  
  async connect() {
    if (canUseSqlite()) {
      this.sqlite = await acquireSqliteEntry(this.path);
      return;
    }
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
    if (this.sqlite) {
      releaseSqliteEntry(this.path);
      this.sqlite = null;
    }
    console.warn('[MOCK] SqliteConnection.close');
  }
  
  // 其他方法的模拟实现...
  async addBlob(key, blob) {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.addV1Blob.run(key, Date.now(), toBuffer(blob));
      return;
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const row = statements.getV1Blob.get(key);
      if (!row) return null;
      return {
        key,
        data: row.data,
        timestamp: new Date(row.ts),
      };
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.deleteV1Blob.run(key);
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      delete data.v1.blobs[key];
    });
  }

  async getBlobKeys() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      return statements.getV1BlobKeys.all().map(row => row.key);
    }
    if (!this.store) return [];
    const data = await this.store.read();
    return Object.keys(data.v1.blobs);
  }

  async getUpdates(docId) {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const rows = docId
        ? statements.getV1UpdatesByDoc.all(docId)
        : statements.getV1UpdatesAll.all();
      return rows.map(update => ({
        id: update.id,
        timestamp: new Date(update.ts),
        data: update.data,
        docId: update.docId ?? undefined,
      }));
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const rows = statements.getV1DocTimestamps.all();
      return rows.map(row => ({
        docId: row.docId,
        timestamp: new Date(row.ts),
      }));
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      if (!docId) {
        statements.deleteV1UpdatesAll.run();
        return;
      }
      statements.deleteV1UpdatesByDoc.run(docId);
      return;
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const row = docId
        ? statements.getV1UpdatesCountByDoc.get(docId)
        : statements.getV1UpdatesCountAll.get();
      return row?.count ?? 0;
    }
    if (!this.store) return 0;
    const data = await this.store.read();
    if (!docId) return data.v1.updates.length;
    return data.v1.updates.filter(update => update.docId === docId).length;
  }

  async getAllUpdates() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const rows = statements.getV1UpdatesAll.all();
      return rows.map(update => ({
        id: update.id,
        timestamp: new Date(update.ts),
        data: update.data,
        docId: update.docId ?? undefined,
      }));
    }
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
    if (this.sqlite) {
      const { db, statements } = this.sqlite;
      const tx = db.transaction(() => {
        updates.forEach(update => {
          const ts = Date.now();
          statements.insertV1Update.run(
            update.docId ?? null,
            ts,
            toBuffer(update.data)
          );
        });
      });
      tx();
      return;
    }
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
    if (this.sqlite) {
      const { db, statements } = this.sqlite;
      const tx = db.transaction(() => {
        if (docId) {
          statements.deleteV1UpdatesByDoc.run(docId);
        } else {
          statements.deleteV1UpdatesAll.run();
        }
        updates.forEach(update => {
          const ts = Date.now();
          const resolvedDocId = update.docId ?? docId ?? null;
          statements.insertV1Update.run(
            resolvedDocId,
            ts,
            toBuffer(update.data)
          );
        });
      });
      tx();
      return;
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const row = statements.getV1ServerClock.get(key);
      if (!row) return null;
      return {
        key,
        data: row.data,
        timestamp: new Date(row.ts),
      };
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.setV1ServerClock.run(key, Date.now(), toBuffer(dataValue));
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.serverClock[key] = {
        data: uint8ArrayToBase64(dataValue),
        ts: Date.now(),
      };
    });
  }

  async getServerClockKeys() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      return statements.getV1ServerClockKeys.all().map(row => row.key);
    }
    if (!this.store) return [];
    const data = await this.store.read();
    return Object.keys(data.v1.serverClock);
  }

  async clearServerClock() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.clearV1ServerClock.run();
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.serverClock = {};
    });
  }

  async delServerClock(key) {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.delV1ServerClock.run(key);
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      delete data.v1.serverClock[key];
    });
  }

  async getSyncMetadata(key) {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const row = statements.getV1SyncMetadata.get(key);
      if (!row) return null;
      return {
        key,
        data: row.data,
        timestamp: new Date(row.ts),
      };
    }
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
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.setV1SyncMetadata.run(key, Date.now(), toBuffer(dataValue));
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.syncMetadata[key] = {
        data: uint8ArrayToBase64(dataValue),
        ts: Date.now(),
      };
    });
  }

  async getSyncMetadataKeys() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      return statements.getV1SyncMetadataKeys.all().map(row => row.key);
    }
    if (!this.store) return [];
    const data = await this.store.read();
    return Object.keys(data.v1.syncMetadata);
  }

  async clearSyncMetadata() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.clearV1SyncMetadata.run();
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.syncMetadata = {};
    });
  }

  async delSyncMetadata(key) {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.delV1SyncMetadata.run(key);
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      delete data.v1.syncMetadata[key];
    });
  }

  async initVersion() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const row = statements.getV1Version.get('version');
      if (!row?.value) {
        statements.setV1Version.run('version', 1);
      }
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      if (!data.v1.version) {
        data.v1.version = 1;
      }
    });
  }

  async setVersion(version) {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      statements.setV1Version.run('version', version);
      return;
    }
    if (!this.store) return;
    await this.store.withWrite(data => {
      data.v1.version = version;
    });
  }

  async getMaxVersion() {
    if (this.sqlite) {
      const { statements } = this.sqlite;
      const row = statements.getV1Version.get('version');
      return row?.value ?? 1;
    }
    if (!this.store) return 1;
    const data = await this.store.read();
    return data.v1.version ?? 1;
  }

  async migrateAddDocId() {
    return;
  }

  async checkpoint() {
    if (this.sqlite) {
      this.sqlite.db.pragma('wal_checkpoint(TRUNCATE)');
      return;
    }
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
