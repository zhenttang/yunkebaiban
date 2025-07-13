import { type Logger } from '@blocksuite/global/utils';
import type { BlobSource } from './source.js';
export interface BlobStatus {
    isStorageOverCapacity: boolean;
}
/**
 * # BlobEngine
 *
 * sync blobs between storages in background.
 *
 * all operations priority use main, then use shadows.
 */
export declare class BlobEngine {
    readonly main: BlobSource;
    readonly shadows: BlobSource[];
    readonly logger: Logger;
    private _abort;
    get sources(): BlobSource[];
    constructor(main: BlobSource, shadows: BlobSource[], logger: Logger);
    delete(_key: string): Promise<void>;
    get(key: string): Promise<Blob | null>;
    list(): Promise<string[]>;
    set(value: Blob): Promise<string>;
    set(key: string, value: Blob): Promise<string>;
    blobState$(key: string): import("rxjs").Observable<import("./source.js").BlobState> | null;
    upload(key: string): Promise<boolean> | null;
    start(): void;
    stop(): void;
    sync(): Promise<void>;
}
//# sourceMappingURL=engine.d.ts.map