import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

import {
  type BlobRecord,
  type DocClock,
  type DocRecord,
  type ListedBlobRecord,
  parseUniversalId,
  type SpaceType,
} from '@yunke/nbstore';
import type { NativeDBApis } from '@yunke/nbstore/sqlite';
import type { NativeDBV1Apis } from '@yunke/nbstore/sqlite/v1';
import { mergeUpdates } from 'yjs';

import {
  ensureHandlePermission,
  loadOfflineRootHandle,
} from './offline-file-handle';

const SQLITE_SCHEMA_VERSION = 1;
const OFFLINE_DEBUG =
  typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.debug === true;

const logInfo = (message: string, data?: Record<string, unknown>) => {
  if (!OFFLINE_DEBUG) return;
  if (data) {
    console.info('[offline-db]', message, data);
  } else {
    console.info('[offline-db]', message);
  }
};

const logWarn = (message: string, data?: Record<string, unknown>) => {
  if (!OFFLINE_DEBUG) return;
  if (data) {
    console.warn('[offline-db]', message, data);
  } else {
    console.warn('[offline-db]', message);
  }
};

let sqlInitPromise: Promise<SqlJsStatic> | null = null;
const sqlWasmUrl = new URL('sql.js/dist/sql-wasm.wasm', import.meta.url).toString();

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlInitPromise) {
    sqlInitPromise = initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }
  return sqlInitPromise;
}

function initSqliteSchema(db: Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
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

  const stmt = db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  stmt.bind(['schema_version', String(SQLITE_SCHEMA_VERSION)]);
  stmt.step();
  stmt.free();
}

function escapeFilename(name: string) {
  return name
    .replaceAll(/[\\/!@#$%^&*()+~`"':;,?<>|]/g, '_')
    .split('_')
    .filter(Boolean)
    .join('_');
}

async function getDbFileHandle(universalId: string): Promise<FileSystemFileHandle> {
  const root = await loadOfflineRootHandle();
  if (!root) {
    logWarn('offline root handle missing');
    throw new Error('离线目录未选择');
  }
  const granted = await ensureHandlePermission(root);
  if (!granted) {
    logWarn('offline root permission denied', { root: root.name });
    throw new Error('离线目录未授权');
  }
  const { peer, type, id } = parseUniversalId(universalId);
  const spaceDirName = type === 'userspace' ? 'userspaces' : 'workspaces';
  const spaceDir = await root.getDirectoryHandle(spaceDirName, { create: true });
  const peerDir = await spaceDir.getDirectoryHandle(escapeFilename(peer), {
    create: true,
  });
  const workspaceDir = await peerDir.getDirectoryHandle(id, { create: true });
  const handle = await workspaceDir.getFileHandle('storage.db', { create: true });
  logInfo('resolved db handle', {
    root: root.name,
    path: `${spaceDirName}/${escapeFilename(peer)}/${id}/storage.db`,
  });
  return handle;
}

async function getV1DbFileHandle(
  spaceType: SpaceType,
  workspaceId: string
): Promise<FileSystemFileHandle> {
  const root = await loadOfflineRootHandle();
  if (!root) {
    logWarn('offline root handle missing');
    throw new Error('离线目录未选择');
  }
  const granted = await ensureHandlePermission(root);
  if (!granted) {
    logWarn('offline root permission denied', { root: root.name });
    throw new Error('离线目录未授权');
  }
  const spaceDirName = spaceType === 'userspace' ? 'userspaces' : 'workspaces';
  const spaceDir = await root.getDirectoryHandle(spaceDirName, { create: true });
  const workspaceDir = await spaceDir.getDirectoryHandle(workspaceId, {
    create: true,
  });
  const handle = await workspaceDir.getFileHandle('storage.db', { create: true });
  logInfo('resolved v1 db handle', {
    root: root.name,
    path: `${spaceDirName}/${workspaceId}/storage.db`,
  });
  return handle;
}

function readFirstRow(db: Database, sql: string, params: unknown[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function readAllRows(db: Database, sql: string, params: unknown[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, any>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function execStatement(db: Database, sql: string, params: unknown[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

class SqliteFileEntry {
  db: Database;
  handle: FileSystemFileHandle;
  queue: Promise<unknown> = Promise.resolve();
  lastSize: number | null = null;

  constructor(db: Database, handle: FileSystemFileHandle) {
    this.db = db;
    this.handle = handle;
  }

  async runExclusive<T>(action: () => Promise<T>): Promise<T> {
    const task = this.queue.then(action);
    this.queue = task.catch(() => {});
    return task;
  }

  async flush() {
    const data = this.db.export();
    const writable = await this.handle.createWritable();
    await writable.write(data);
    await writable.close();
    if (data.length !== this.lastSize) {
      logInfo('flushed db file', {
        bytes: data.length,
        file: this.handle.name,
      });
      this.lastSize = data.length;
    }
  }
}

async function openSqliteEntry(handle: FileSystemFileHandle): Promise<SqliteFileEntry> {
  const sql = await getSqlJs();
  const file = await handle.getFile();
  const buffer = file.size > 0 ? new Uint8Array(await file.arrayBuffer()) : null;
  const db = buffer ? new sql.Database(buffer) : new sql.Database();
  initSqliteSchema(db);
  logInfo('opened db file', { file: handle.name, bytes: file.size });
  return new SqliteFileEntry(db, handle);
}

export function createFileNativeDBApis(): NativeDBApis {
  const entries = new Map<string, SqliteFileEntry>();

  const getEntry = async (universalId: string) => {
    try {
      let entry = entries.get(universalId);
      if (!entry) {
        const handle = await getDbFileHandle(universalId);
        entry = await openSqliteEntry(handle);
        entries.set(universalId, entry);
        logInfo('created db entry', { id: universalId });
      }
      return entry;
    } catch (error) {
      logWarn('failed to open db entry', {
        id: universalId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const api: NativeDBApis = {
    connect: async (id: string) => {
      logInfo('connect', { id });
      await getEntry(id);
    },
    disconnect: async (id: string) => {
      const entry = entries.get(id);
      if (!entry) return;
      await entry.runExclusive(async () => {
        await entry.flush();
        entry.db.close();
      });
      entries.delete(id);
      logInfo('disconnect', { id });
    },
    pushUpdate: async (id: string, docId: string, update: Uint8Array) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT MAX(ts) AS ts FROM doc_updates WHERE doc_id=?',
          [docId]
        ) as { ts?: number } | null;
        const now = Date.now();
        const ts = row?.ts ? Math.max(now, row.ts + 1) : now;
        execStatement(
          entry.db,
          'INSERT INTO doc_updates (doc_id, ts, bin) VALUES (?, ?, ?)',
          [docId, ts, update]
        );
        execStatement(
          entry.db,
          'INSERT INTO doc_clocks (doc_id, ts) VALUES (?, ?) ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts',
          [docId, ts]
        );
        await entry.flush();
        return new Date(ts);
      });
    },
    getDocSnapshot: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts, bin FROM doc_snapshots WHERE doc_id=?',
          [docId]
        ) as { ts?: number; bin?: Uint8Array } | null;
        if (!row) return null;
        return {
          docId,
          bin: row.bin ?? new Uint8Array(),
          timestamp: new Date(row.ts ?? 0),
        } satisfies DocRecord;
      });
    },
    setDocSnapshot: async (id: string, snapshot: DocRecord) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO doc_snapshots (doc_id, ts, bin)
           VALUES (?, ?, ?)
           ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts, bin=excluded.bin
           WHERE excluded.ts >= doc_snapshots.ts`,
          [snapshot.docId, snapshot.timestamp.getTime(), snapshot.bin]
        );
        await entry.flush();
        return true;
      });
    },
    getDocUpdates: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT ts, bin FROM doc_updates WHERE doc_id=? ORDER BY ts ASC',
          [docId]
        ) as { ts?: number; bin?: Uint8Array }[];
        return rows.map(row => ({
          docId,
          bin: row.bin ?? new Uint8Array(),
          timestamp: new Date(row.ts ?? 0),
        }));
      });
    },
    markUpdatesMerged: async (id: string, docId: string, updates: Date[]) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        entry.db.exec('BEGIN');
        updates.forEach(update => {
          execStatement(
            entry.db,
            'DELETE FROM doc_updates WHERE doc_id=? AND ts=?',
            [docId, update.getTime()]
          );
        });
        entry.db.exec('COMMIT');
        await entry.flush();
        return updates.length;
      });
    },
    deleteDoc: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        entry.db.exec('BEGIN');
        execStatement(
          entry.db,
          'DELETE FROM doc_updates WHERE doc_id=?',
          [docId]
        );
        execStatement(
          entry.db,
          'DELETE FROM doc_snapshots WHERE doc_id=?',
          [docId]
        );
        execStatement(
          entry.db,
          'DELETE FROM doc_clocks WHERE doc_id=?',
          [docId]
        );
        entry.db.exec('COMMIT');
        await entry.flush();
      });
    },
    getDocClocks: async (id: string, after?: Date | null) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = after
          ? readAllRows(
              entry.db,
              'SELECT doc_id AS docId, ts FROM doc_clocks WHERE ts > ?',
              [after.getTime()]
            )
          : readAllRows(
              entry.db,
              'SELECT doc_id AS docId, ts FROM doc_clocks',
              []
            );
        return rows.map(row => ({
          docId: row.docId as string,
          timestamp: new Date(row.ts as number),
        })) as DocClock[];
      });
    },
    getDocClock: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM doc_clocks WHERE doc_id=?',
          [docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    getBlob: async (id: string, key: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT data, mime, size, created_at FROM blobs WHERE key=?',
          [key]
        ) as { data?: Uint8Array; mime?: string; size?: number; created_at?: number } | null;
        if (!row) return null;
        return {
          key,
          data: row.data ?? new Uint8Array(),
          mime: row.mime ?? '',
          size: row.size ?? 0,
          createdAt: new Date(row.created_at ?? Date.now()),
        } satisfies BlobRecord;
      });
    },
    setBlob: async (id: string, blob: BlobRecord) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        const meta = readFirstRow(
          entry.db,
          'SELECT created_at FROM blobs WHERE key=?',
          [blob.key]
        ) as { created_at?: number } | null;
        const createdAt = meta?.created_at ?? Date.now();
        execStatement(
          entry.db,
          `INSERT INTO blobs (key, data, mime, size, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET data=excluded.data, mime=excluded.mime, size=excluded.size, created_at=blobs.created_at`,
          [
            blob.key,
            blob.data,
            blob.mime ?? null,
            blob.data.length,
            createdAt,
          ]
        );
        await entry.flush();
      });
    },
    deleteBlob: async (id: string, key: string) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(entry.db, 'DELETE FROM blobs WHERE key=?', [key]);
        await entry.flush();
      });
    },
    releaseBlobs: async () => {
      return;
    },
    listBlobs: async (id: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT key, size, mime, created_at FROM blobs',
          []
        ) as { key?: string; size?: number; mime?: string; created_at?: number }[];
        return rows.map(row => ({
          key: row.key ?? '',
          size: row.size ?? 0,
          mime: row.mime ?? '',
          createdAt: new Date(row.created_at ?? Date.now()),
        })) satisfies ListedBlobRecord[];
      });
    },
    getPeerRemoteClocks: async (id: string, peer: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?',
          [peer, 'remote']
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId ?? '',
          timestamp: new Date(row.ts ?? 0),
        })) as DocClock[];
      });
    },
    getPeerRemoteClock: async (id: string, peer: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?',
          [peer, 'remote', docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    setPeerRemoteClock: async (id: string, peer: string, docId: string, clock: Date) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO peer_clocks (peer, type, doc_id, ts)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`,
          [peer, 'remote', docId, clock.getTime()]
        );
        await entry.flush();
      });
    },
    getPeerPulledRemoteClocks: async (id: string, peer: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?',
          [peer, 'pulled']
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId ?? '',
          timestamp: new Date(row.ts ?? 0),
        })) as DocClock[];
      });
    },
    getPeerPulledRemoteClock: async (
      id: string,
      peer: string,
      docId: string
    ) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?',
          [peer, 'pulled', docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    setPeerPulledRemoteClock: async (
      id: string,
      peer: string,
      docId: string,
      clock: Date
    ) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO peer_clocks (peer, type, doc_id, ts)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`,
          [peer, 'pulled', docId, clock.getTime()]
        );
        await entry.flush();
      });
    },
    getPeerPushedClocks: async (id: string, peer: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?',
          [peer, 'pushed']
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId ?? '',
          timestamp: new Date(row.ts ?? 0),
        })) as DocClock[];
      });
    },
    getPeerPushedClock: async (
      id: string,
      peer: string,
      docId: string
    ) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?',
          [peer, 'pushed', docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    setPeerPushedClock: async (
      id: string,
      peer: string,
      docId: string,
      clock: Date
    ) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO peer_clocks (peer, type, doc_id, ts)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`,
          [peer, 'pushed', docId, clock.getTime()]
        );
        await entry.flush();
      });
    },
    clearClocks: async (id: string) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(entry.db, 'DELETE FROM peer_clocks', []);
        execStatement(entry.db, 'DELETE FROM blob_uploaded_at', []);
        await entry.flush();
      });
    },
    setBlobUploadedAt: async (
      id: string,
      peer: string,
      blobId: string,
      uploadedAt: Date | null
    ) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        const ts = uploadedAt ? uploadedAt.getTime() : 0;
        execStatement(
          entry.db,
          `INSERT INTO blob_uploaded_at (peer, blob_id, ts)
           VALUES (?, ?, ?)
           ON CONFLICT(peer, blob_id) DO UPDATE SET ts=excluded.ts`,
          [peer, blobId, ts]
        );
        await entry.flush();
      });
    },
    getBlobUploadedAt: async (id: string, peer: string, blobId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM blob_uploaded_at WHERE peer=? AND blob_id=?',
          [peer, blobId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return new Date(row.ts ?? 0);
      });
    },
  };

  return api;
}

export function createFileNativeDBV1Apis(): NativeDBV1Apis {
  return {
    getBlob: async (
      spaceType: SpaceType,
      workspaceId: string,
      key: string
    ) => {
      const handle = await getV1DbFileHandle(spaceType, workspaceId);
      const entry = await openSqliteEntry(handle);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT data FROM v1_blobs WHERE key=?',
          [key]
        ) as { data?: Uint8Array } | null;
        entry.db.close();
        if (!row?.data) return null;
        return row.data;
      });
    },
    getBlobKeys: async (spaceType: SpaceType, workspaceId: string) => {
      const handle = await getV1DbFileHandle(spaceType, workspaceId);
      const entry = await openSqliteEntry(handle);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT key FROM v1_blobs',
          []
        ) as { key?: string }[];
        entry.db.close();
        return rows.map(row => row.key ?? '');
      });
    },
    getDocAsUpdates: async (
      spaceType: SpaceType,
      workspaceId: string,
      subdocId: string
    ) => {
      const handle = await getV1DbFileHandle(spaceType, workspaceId);
      const entry = await openSqliteEntry(handle);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT data FROM v1_updates WHERE doc_id IS ? ORDER BY id ASC',
          [subdocId]
        ) as { data?: Uint8Array }[];
        entry.db.close();
        if (rows.length === 0) {
          return new Uint8Array([0, 0]);
        }
        const updates = rows.map(row => row.data ?? new Uint8Array());
        return mergeUpdates(updates);
      });
    },
    getDocTimestamps: async (spaceType: SpaceType, workspaceId: string) => {
      const handle = await getV1DbFileHandle(spaceType, workspaceId);
      const entry = await openSqliteEntry(handle);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, MAX(ts) AS ts FROM v1_updates WHERE doc_id IS NOT NULL GROUP BY doc_id',
          []
        ) as { docId?: string; ts?: number }[];
        entry.db.close();
        return rows.map(row => ({
          docId: row.docId,
          timestamp: new Date(row.ts ?? 0),
        }));
      });
    },
  };
}
