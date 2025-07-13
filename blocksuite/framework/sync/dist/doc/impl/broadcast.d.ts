import type { DocSource } from '../source.js';
export declare class BroadcastChannelDocSource implements DocSource {
    readonly channelName: string;
    private readonly _onMessage;
    channel: BroadcastChannel;
    docMap: Map<string, Uint8Array<ArrayBufferLike>>;
    name: string;
    constructor(channelName?: string);
    pull(docId: string, state: Uint8Array): {
        data: Uint8Array<ArrayBufferLike>;
        state: Uint8Array<ArrayBufferLike>;
    } | null;
    push(docId: string, data: Uint8Array): void;
    subscribe(cb: (docId: string, data: Uint8Array) => void): () => void;
}
//# sourceMappingURL=broadcast.d.ts.map