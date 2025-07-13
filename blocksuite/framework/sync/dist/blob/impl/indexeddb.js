import { createStore, del, get, keys, set } from 'idb-keyval';
export class IndexedDBBlobSource {
    constructor(name) {
        this.name = name;
        this.mimeTypeStore = createStore(`${this.name}_blob_mime`, 'blob_mime');
        this.readonly = false;
        this.store = createStore(`${this.name}_blob`, 'blob');
    }
    async delete(key) {
        await del(key, this.store);
        await del(key, this.mimeTypeStore);
    }
    async get(key) {
        const res = await get(key, this.store);
        if (res) {
            return new Blob([res], {
                type: await get(key, this.mimeTypeStore),
            });
        }
        return null;
    }
    async list() {
        const list = await keys(this.store);
        return list;
    }
    async set(key, value) {
        await set(key, await value.arrayBuffer(), this.store);
        await set(key, value.type, this.mimeTypeStore);
        return key;
    }
}
//# sourceMappingURL=indexeddb.js.map