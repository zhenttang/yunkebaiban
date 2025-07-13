export class AsyncQueue {
    get length() {
        return this._queue.length;
    }
    constructor(init = []) {
        this._resolveUpdate = null;
        this._waitForUpdate = null;
        this._queue = init;
    }
    clear() {
        this._queue = [];
    }
    find(predicate) {
        return this._queue.find(predicate);
    }
    async next(abort, dequeue = a => a.shift()) {
        const update = dequeue(this._queue);
        if (update) {
            return update;
        }
        else {
            if (!this._waitForUpdate) {
                this._waitForUpdate = new Promise(resolve => {
                    this._resolveUpdate = resolve;
                });
            }
            await Promise.race([
                this._waitForUpdate,
                new Promise((_, reject) => {
                    if (abort?.aborted) {
                        reject(abort?.reason);
                    }
                    abort?.addEventListener('abort', () => {
                        reject(abort.reason);
                    });
                }),
            ]);
            return this.next(abort, dequeue);
        }
    }
    push(...updates) {
        this._queue.push(...updates);
        if (this._resolveUpdate) {
            const resolve = this._resolveUpdate;
            this._resolveUpdate = null;
            this._waitForUpdate = null;
            resolve();
        }
    }
    remove(predicate) {
        const index = this._queue.findIndex(predicate);
        if (index !== -1) {
            this._queue.splice(index, 1);
        }
    }
}
export class PriorityAsyncQueue extends AsyncQueue {
    constructor(init = [], priorityTarget = new SharedPriorityTarget()) {
        super(init);
        this.priorityTarget = priorityTarget;
    }
    next(abort) {
        return super.next(abort, arr => {
            if (this.priorityTarget.priorityRule !== null) {
                const index = arr.findIndex(update => this.priorityTarget.priorityRule?.(update.id));
                if (index !== -1) {
                    return arr.splice(index, 1)[0];
                }
            }
            return arr.shift();
        });
    }
}
/**
 * 共享优先级目标可以被多个队列共享。
 */
export class SharedPriorityTarget {
    constructor() {
        this.priorityRule = null;
    }
}
//# sourceMappingURL=async-queue.js.map