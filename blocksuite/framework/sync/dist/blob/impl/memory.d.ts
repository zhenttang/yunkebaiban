import type { BlobSource } from '../source.js';
export declare class MemoryBlobSource implements BlobSource {
    readonly map: Map<string, Blob>;
    name: string;
    readonly: boolean;
    delete(key: string): Promise<void>;
    get(key: string): Promise<Blob | null>;
    list(): Promise<string[]>;
    set(key: string, value: Blob): Promise<string>;
}
//# sourceMappingURL=memory.d.ts.map