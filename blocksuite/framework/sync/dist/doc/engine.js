import { Subject } from 'rxjs';
import { SharedPriorityTarget } from '../utils/async-queue.js';
import { MANUALLY_STOP, throwIfAborted } from '../utils/throw-if-aborted.js';
import { DocEngineStep, DocPeerStep } from './consts.js';
import { SyncPeer } from './peer.js';
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
export class DocEngine {
    get rootDocId() {
        return this.rootDoc.guid;
    }
    get status() {
        return this._status;
    }
    constructor(rootDoc, main, shadows, logger) {
        this.rootDoc = rootDoc;
        this.main = main;
        this.shadows = shadows;
        this.logger = logger;
        this._abort = new AbortController();
        this.onStatusChange = new Subject();
        this.priorityTarget = new SharedPriorityTarget();
        this._status = {
            step: DocEngineStep.Stopped,
            main: null,
            shadows: shadows.map(() => null),
            retrying: false,
        };
        this.logger.debug(`syne-engine:${this.rootDocId} status init`, this.status);
    }
    setStatus(s) {
        this.logger.debug(`syne-engine:${this.rootDocId} status change`, s);
        this._status = s;
        this.onStatusChange.next(s);
    }
    canGracefulStop() {
        return !!this.status.main && this.status.main.pendingPushUpdates === 0;
    }
    forceStop() {
        this._abort.abort(MANUALLY_STOP);
        this.setStatus({
            step: DocEngineStep.Stopped,
            main: null,
            shadows: this.shadows.map(() => null),
            retrying: false,
        });
    }
    setPriorityRule(target) {
        this.priorityTarget.priorityRule = target;
    }
    start() {
        if (this.status.step !== DocEngineStep.Stopped) {
            this.forceStop();
        }
        this._abort = new AbortController();
        this.sync(this._abort.signal).catch(err => {
            // should never reach here
            this.logger.error(`syne-engine:${this.rootDocId}`, err);
        });
    }
    // main sync process, should never return until abort
    async sync(signal) {
        const state = {
            mainPeer: null,
            shadowPeers: this.shadows.map(() => null),
        };
        const cleanUp = [];
        try {
            // Step 1: start main sync peer
            state.mainPeer = new SyncPeer(this.rootDoc, this.main, this.priorityTarget, this.logger);
            const subscriber = state.mainPeer.onStatusChange.subscribe(() => {
                if (!signal.aborted)
                    this.updateSyncingState(state.mainPeer, state.shadowPeers);
            });
            cleanUp.push(() => {
                subscriber.unsubscribe();
            });
            this.updateSyncingState(state.mainPeer, state.shadowPeers);
            // Step 2: wait for main sync complete
            await state.mainPeer.waitForLoaded(signal);
            // Step 3: start shadow sync peer
            state.shadowPeers = this.shadows.map(shadow => {
                const peer = new SyncPeer(this.rootDoc, shadow, this.priorityTarget, this.logger);
                const subscriber = peer.onStatusChange.subscribe(() => {
                    if (!signal.aborted)
                        this.updateSyncingState(state.mainPeer, state.shadowPeers);
                });
                cleanUp.push(() => {
                    subscriber.unsubscribe();
                });
                return peer;
            });
            this.updateSyncingState(state.mainPeer, state.shadowPeers);
            // Step 4: continuously sync main and shadow
            // wait for abort
            await new Promise((_, reject) => {
                if (signal.aborted) {
                    reject(signal.reason);
                }
                signal.addEventListener('abort', () => {
                    reject(signal.reason);
                });
            });
        }
        catch (error) {
            if (error === MANUALLY_STOP || signal.aborted) {
                return;
            }
            throw error;
        }
        finally {
            // stop peers
            state.mainPeer?.stop();
            for (const shadowPeer of state.shadowPeers) {
                shadowPeer?.stop();
            }
            for (const clean of cleanUp) {
                clean();
            }
        }
    }
    updateSyncingState(local, shadows) {
        let step = DocEngineStep.Synced;
        const allPeer = [local, ...shadows];
        for (const peer of allPeer) {
            if (!peer || peer.status.step !== DocPeerStep.Synced) {
                step = DocEngineStep.Syncing;
                break;
            }
        }
        this.setStatus({
            step,
            main: local?.status ?? null,
            shadows: shadows.map(peer => peer?.status ?? null),
            retrying: allPeer.some(peer => peer?.status.step === DocPeerStep.Retrying),
        });
    }
    async waitForGracefulStop(abort) {
        await Promise.race([
            new Promise((_, reject) => {
                if (abort?.aborted) {
                    reject(abort?.reason);
                }
                abort?.addEventListener('abort', () => {
                    reject(abort.reason);
                });
            }),
            new Promise(resolve => {
                this.onStatusChange.subscribe(() => {
                    if (this.canGracefulStop()) {
                        resolve();
                    }
                });
            }),
        ]);
        throwIfAborted(abort);
        this.forceStop();
    }
    async waitForLoadedRootDoc(abort) {
        function isLoadedRootDoc(status) {
            return ![status.main, ...status.shadows].some(peer => !peer || peer.step <= DocPeerStep.LoadingRootDoc);
        }
        if (isLoadedRootDoc(this.status)) {
            return;
        }
        else {
            return Promise.race([
                new Promise(resolve => {
                    this.onStatusChange.subscribe(status => {
                        if (isLoadedRootDoc(status)) {
                            resolve();
                        }
                    });
                }),
                new Promise((_, reject) => {
                    if (abort?.aborted) {
                        reject(abort?.reason);
                    }
                    abort?.addEventListener('abort', () => {
                        reject(abort.reason);
                    });
                }),
            ]);
        }
    }
    async waitForSynced(abort) {
        if (this.status.step === DocEngineStep.Synced) {
            return;
        }
        else {
            return Promise.race([
                new Promise(resolve => {
                    this.onStatusChange.subscribe(status => {
                        if (status.step === DocEngineStep.Synced) {
                            resolve();
                        }
                    });
                }),
                new Promise((_, reject) => {
                    if (abort?.aborted) {
                        reject(abort?.reason);
                    }
                    abort?.addEventListener('abort', () => {
                        reject(abort.reason);
                    });
                }),
            ]);
        }
    }
}
//# sourceMappingURL=engine.js.map