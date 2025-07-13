import { openDB } from 'idb';
import { diffUpdate, encodeStateVectorFromUpdate, mergeUpdates } from 'yjs';
export const dbVersion = 1;
export const DEFAULT_DB_NAME = 'blocksuite-local';
export function upgradeDB(db) {
    db.createObjectStore('collection', { keyPath: 'id' });
}
export class IndexedDBDocSource {
    constructor(dbName = DEFAULT_DB_NAME) {
        this.dbName = dbName;
        // indexeddb could be shared between tabs, so we use broadcast channel to notify other tabs
        this.channel = new BroadcastChannel('indexeddb:' + this.dbName);
        this.dbPromise = null;
        this.mergeCount = 1;
        this.name = 'indexeddb';
    }
    getDb() {
        if (this.dbPromise === null) {
            this.dbPromise = openDB(this.dbName, dbVersion, {
                upgrade: upgradeDB,
            });
        }
        return this.dbPromise;
    }
    async pull(docId, state) {
        const db = await this.getDb();
        const store = db
            .transaction('collection', 'readonly')
            .objectStore('collection');
        const data = await store.get(docId);
        if (!data) {
            return null;
        }
        const { updates } = data;
        const update = mergeUpdates(updates.map(({ update }) => update));
        const diff = state.length ? diffUpdate(update, state) : update;
        return { data: diff, state: encodeStateVectorFromUpdate(update) };
    }
    async push(docId, data) {
        const db = await this.getDb();
        const store = db
            .transaction('collection', 'readwrite')
            .objectStore('collection');
        const { updates } = (await store.get(docId)) ?? { updates: [] };
        let rows = [
            ...updates,
            { timestamp: Date.now(), update: data },
        ];
        if (this.mergeCount && rows.length >= this.mergeCount) {
            const merged = mergeUpdates(rows.map(({ update }) => update));
            rows = [{ timestamp: Date.now(), update: merged }];
        }
        await store.put({
            id: docId,
            updates: rows,
        });
        this.channel.postMessage({
            type: 'db-updated',
            payload: { docId, update: data },
        });
    }
    subscribe(cb) {
        function onMessage(event) {
            const { type, payload } = event.data;
            if (type === 'db-updated') {
                const { docId, update } = payload;
                cb(docId, update);
            }
        }
        this.channel.addEventListener('message', onMessage);
        return () => {
            this.channel.removeEventListener('message', onMessage);
        };
    }
}
//# sourceMappingURL=indexeddb.js.map