import type { Awareness } from 'y-protocols/awareness';
import type { AwarenessSource } from './source.js';
export declare class AwarenessEngine {
    readonly awareness: Awareness;
    readonly sources: AwarenessSource[];
    constructor(awareness: Awareness, sources: AwarenessSource[]);
    connect(): void;
    disconnect(): void;
}
//# sourceMappingURL=engine.d.ts.map