import type { Logger } from '@blocksuite/global/utils';
import { Subject } from 'rxjs';
import type { Doc } from 'yjs';
import { SharedPriorityTarget } from '../utils/async-queue.js';
import { DocEngineStep } from './consts.js';
import { type DocPeerStatus, SyncPeer } from './peer.js';
import type { DocSource } from './source.js';
export interface DocEngineStatus {
    step: DocEngineStep;
    main: DocPeerStatus | null;
    shadows: (DocPeerStatus | null)[];
    retrying: boolean;
}
/**
 * # DocEngine
 *
 * ```
 *                    ┌────────────┐
 *                    │  DocEngine │
 *                    └─────┬──────┘
 *                          │
 *                          ▼
 *                    ┌────────────┐
 *                    │   DocPeer  │
 *          ┌─────────┤    main    ├─────────┐
 *          │         └─────┬──────┘         │
 *          │               │                │
 *          ▼               ▼                ▼
 *   ┌────────────┐   ┌────────────┐   ┌────────────┐
 *   │   DocPeer  │   │   DocPeer  │   │   DocPeer  │
 *   │   shadow   │   │   shadow   │   │   shadow   │
 *   └────────────┘   └────────────┘   └────────────┘
 * ```
 *
 * doc engine manage doc peers
 *
 * Sync steps:
 * 1. start main sync
 * 2. wait for main sync complete
 * 3. start shadow sync
 * 4. continuously sync main and shadows
 */
export declare class DocEngine {
    readonly rootDoc: Doc;
    readonly main: DocSource;
    readonly shadows: DocSource[];
    readonly logger: Logger;
    private _abort;
    private _status;
    readonly onStatusChange: Subject<DocEngineStatus>;
    readonly priorityTarget: SharedPriorityTarget;
    get rootDocId(): string;
    get status(): DocEngineStatus;
    constructor(rootDoc: Doc, main: DocSource, shadows: DocSource[], logger: Logger);
    private setStatus;
    canGracefulStop(): boolean;
    forceStop(): void;
    setPriorityRule(target: ((id: string) => boolean) | null): void;
    start(): void;
    sync(signal: AbortSignal): Promise<void>;
    updateSyncingState(local: SyncPeer | null, shadows: (SyncPeer | null)[]): void;
    waitForGracefulStop(abort?: AbortSignal): Promise<void>;
    waitForLoadedRootDoc(abort?: AbortSignal): Promise<unknown>;
    waitForSynced(abort?: AbortSignal): Promise<unknown>;
}
//# sourceMappingURL=engine.d.ts.map