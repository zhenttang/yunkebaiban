import type { BlobSource } from '../source.js';
export declare class IndexedDBBlobSource implements BlobSource {
    readonly name: string;
    readonly mimeTypeStore: import("idb-keyval").UseStore;
    readonly: boolean;
    readonly store: import("idb-keyval").UseStore;
    constructor(name: string);
    delete(key: string): Promise<void>;
    get(key: string): Promise<Blob | null>;
    list(): Promise<string[]>;
    set(key: string, value: Blob): Promise<string>;
}
//# sourceMappingURL=indexeddb.d.ts.map