import type { Logger } from '@blocksuite/global/utils';
import { Subject } from 'rxjs';
import type { Doc } from 'yjs';
import { PriorityAsyncQueue, SharedPriorityTarget } from '../utils/async-queue.js';
import { DocPeerStep } from './consts.js';
import type { DocSource } from './source.js';
export interface DocPeerStatus {
    step: DocPeerStep;
    totalDocs: number;
    loadedDocs: number;
    pendingPullUpdates: number;
    pendingPushUpdates: number;
}
/**
 * # DocPeer
 * A DocPeer is responsible for syncing one Storage with one Y.Doc and its subdocs.
 *
 * ```
 *                    ┌─────┐
 *                    │Start│
 *                    └──┬──┘
 *                       │
 *    ┌──────┐     ┌─────▼──────┐        ┌────┐
 *    │listen◄─────┤pull rootdoc│        │peer│
 *    └──┬───┘     └─────┬──────┘        └──┬─┘
 *       │               │ onLoad()         │
 *    ┌──▼───┐     ┌─────▼──────┐      ┌────▼────┐
 *    │listen◄─────┤pull subdocs│      │subscribe│
 *    └──┬───┘     └─────┬──────┘      └────┬────┘
 *       │               │ onReady()        │
 *    ┌──▼──┐      ┌─────▼───────┐       ┌──▼──┐
 *    │queue├──────►apply updates◄───────┤queue│
 *    └─────┘      └─────────────┘       └─────┘
 * ```
 *
 * listen: listen for updates from ydoc, typically from user modifications.
 * subscribe: listen for updates from storage, typically from other users.
 *
 */
export declare class SyncPeer {
    readonly rootDoc: Doc;
    readonly source: DocSource;
    readonly priorityTarget: SharedPriorityTarget;
    readonly logger: Logger;
    private _status;
    readonly abort: AbortController;
    handleStorageUpdates: (id: string, data: Uint8Array) => void;
    handleSubdocsUpdate: ({ added, removed, }: {
        added: Set<Doc>;
        removed: Set<Doc>;
    }) => void;
    handleYDocUpdates: (update: Uint8Array, origin: string, doc: Doc) => void;
    readonly onStatusChange: Subject<DocPeerStatus>;
    readonly state: {
        connectedDocs: Map<string, Doc>;
        pushUpdatesQueue: PriorityAsyncQueue<{
            id: string;
            data: Uint8Array[];
        }>;
        pushingUpdate: boolean;
        pullUpdatesQueue: PriorityAsyncQueue<{
            id: string;
            data: Uint8Array;
        }>;
        subdocLoading: boolean;
        subdocsLoadQueue: PriorityAsyncQueue<{
            id: string;
            doc: Doc;
        }>;
    };
    get name(): string;
    private set status(value);
    get status(): DocPeerStatus;
    constructor(rootDoc: Doc, source: DocSource, priorityTarget: SharedPriorityTarget | undefined, logger: Logger);
    connectDoc(doc: Doc, abort: AbortSignal): Promise<void>;
    disconnectDoc(doc: Doc): void;
    initState(): void;
    /**
     * stop sync
     *
     * DocPeer is one-time use, this peer should be discarded after call stop().
     */
    stop(): void;
    /**
     * main synchronization logic
     */
    sync(abortOuter: AbortSignal): Promise<void>;
    /**
     * auto retry after 5 seconds if sync failed
     */
    syncRetryLoop(abort: AbortSignal): Promise<void>;
    updateSyncStatus(): void;
    waitForLoaded(abort?: AbortSignal): Promise<void>;
    waitForSynced(abort?: AbortSignal): Promise<void>;
}
//# sourceMappingURL=peer.d.ts.map