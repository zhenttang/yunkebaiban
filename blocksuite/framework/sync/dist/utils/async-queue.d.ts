export declare class AsyncQueue<T> {
    private _queue;
    private _resolveUpdate;
    private _waitForUpdate;
    get length(): number;
    constructor(init?: T[]);
    clear(): void;
    find(predicate: (update: T) => boolean): T | undefined;
    next(abort?: AbortSignal, dequeue?: (arr: T[]) => T | undefined): Promise<T>;
    push(...updates: T[]): void;
    remove(predicate: (update: T) => boolean): void;
}
export declare class PriorityAsyncQueue<T extends {
    id: string;
}> extends AsyncQueue<T> {
    readonly priorityTarget: SharedPriorityTarget;
    constructor(init?: T[], priorityTarget?: SharedPriorityTarget);
    next(abort?: AbortSignal | undefined): Promise<T>;
}
/**
 * 共享优先级目标可以被多个队列共享。
 */
export declare class SharedPriorityTarget {
    priorityRule: ((id: string) => boolean) | null;
}
//# sourceMappingURL=async-queue.d.ts.map