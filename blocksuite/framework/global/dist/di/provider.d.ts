import type { Container } from './container.js';
import type { GeneralServiceIdentifier, ServiceIdentifierValue, ServiceVariant } from './types.js';
export interface ResolveOptions {
    sameScope?: boolean;
    optional?: boolean;
}
export declare abstract class ServiceProvider {
    abstract container: Container;
    get<T>(identifier: GeneralServiceIdentifier<T>, options?: ResolveOptions): T;
    getAll<T>(identifier: GeneralServiceIdentifier<T>, options?: ResolveOptions): Map<ServiceVariant, T>;
    abstract getAllRaw(identifier: ServiceIdentifierValue, options?: ResolveOptions): Map<ServiceVariant, any>;
    getOptional<T>(identifier: GeneralServiceIdentifier<T>, options?: ResolveOptions): T | null;
    abstract getRaw(identifier: ServiceIdentifierValue, options?: ResolveOptions): any;
}
export declare class ServiceCachePool {
    cache: Map<string, Map<string, any>>;
    getOrInsert(identifier: ServiceIdentifierValue, insert: () => any): any;
}
export declare class ServiceResolver extends ServiceProvider {
    readonly provider: BasicServiceProvider;
    readonly depth: number;
    readonly stack: ServiceIdentifierValue[];
    container: Container;
    constructor(provider: BasicServiceProvider, depth?: number, stack?: ServiceIdentifierValue[]);
    getAllRaw(identifier: ServiceIdentifierValue, { sameScope }?: ResolveOptions): Map<ServiceVariant, any>;
    getRaw(identifier: ServiceIdentifierValue, { sameScope, optional }?: ResolveOptions): any;
    track(identifier: ServiceIdentifierValue): ServiceResolver;
}
export declare class BasicServiceProvider extends ServiceProvider {
    readonly scope: string[];
    readonly parent: ServiceProvider | null;
    readonly cache: ServiceCachePool;
    readonly container: Container;
    constructor(container: Container, scope: string[], parent: ServiceProvider | null);
    getAllRaw(identifier: ServiceIdentifierValue, options?: ResolveOptions): Map<ServiceVariant, any>;
    getRaw(identifier: ServiceIdentifierValue, options?: ResolveOptions): any;
}
//# sourceMappingURL=provider.d.ts.map