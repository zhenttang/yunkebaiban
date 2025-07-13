import type { Awareness } from 'y-protocols/awareness';
import type { AwarenessSource } from '../source.js';
type AwarenessChanges = Record<'added' | 'updated' | 'removed', number[]>;
type ChannelMessage = {
    type: 'connect';
} | {
    type: 'update';
    update: Uint8Array;
};
export declare class BroadcastChannelAwarenessSource implements AwarenessSource {
    readonly channelName: string;
    awareness: Awareness | null;
    channel: BroadcastChannel | null;
    handleAwarenessUpdate: (changes: AwarenessChanges, origin: unknown) => void;
    constructor(channelName: string);
    connect(awareness: Awareness): void;
    disconnect(): void;
    handleChannelMessage(event: MessageEvent<ChannelMessage>): void;
}
export {};
//# sourceMappingURL=broadcast.d.ts.map