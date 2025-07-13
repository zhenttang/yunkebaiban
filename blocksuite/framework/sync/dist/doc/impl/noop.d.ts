import type { DocSource } from '../source.js';
export declare class NoopDocSource implements DocSource {
    name: string;
    pull(_docId: string, _data: Uint8Array): null;
    push(_docId: string, _data: Uint8Array): void;
    subscribe(_cb: (docId: string, data: Uint8Array) => void, _disconnect: (reason: string) => void): () => void;
}
//# sourceMappingURL=noop.d.ts.map