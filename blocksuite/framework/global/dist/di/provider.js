import { CircularDependencyError, MissingDependencyError, RecursionLimitError, ServiceNotFoundError, } from './error.js';
import { parseIdentifier } from './identifier.js';
export class ServiceProvider {
    get(identifier, options) {
        return this.getRaw(parseIdentifier(identifier), {
            ...options,
            optional: false,
        });
    }
    getAll(identifier, options) {
        return this.getAllRaw(parseIdentifier(identifier), {
            ...options,
        });
    }
    getOptional(identifier, options) {
        return this.getRaw(parseIdentifier(identifier), {
            ...options,
            optional: true,
        });
    }
}
export class ServiceCachePool {
    constructor() {
        this.cache = new Map();
    }
    getOrInsert(identifier, insert) {
        const cache = this.cache.get(identifier.identifierName) ?? new Map();
        if (!cache.has(identifier.variant)) {
            cache.set(identifier.variant, insert());
        }
        const cached = cache.get(identifier.variant);
        this.cache.set(identifier.identifierName, cache);
        return cached;
    }
}
export class ServiceResolver extends ServiceProvider {
    constructor(provider, depth = 0, stack = []) {
        super();
        this.provider = provider;
        this.depth = depth;
        this.stack = stack;
        this.container = this.provider.container;
    }
    getAllRaw(identifier, { sameScope = false } = {}) {
        const vars = this.provider.container.getFactoryAll(identifier, this.provider.scope);
        if (vars === undefined) {
            if (this.provider.parent && !sameScope) {
                return this.provider.parent.getAllRaw(identifier);
            }
            return new Map();
        }
        const result = new Map();
        for (const [variant, factory] of vars) {
            const service = this.provider.cache.getOrInsert({ identifierName: identifier.identifierName, variant }, () => {
                const nextResolver = this.track(identifier);
                try {
                    return factory(nextResolver);
                }
                catch (err) {
                    if (err instanceof ServiceNotFoundError) {
                        throw new MissingDependencyError(identifier, err.identifier, this.stack);
                    }
                    throw err;
                }
            });
            result.set(variant, service);
        }
        return result;
    }
    getRaw(identifier, { sameScope = false, optional = false } = {}) {
        const factory = this.provider.container.getFactory(identifier, this.provider.scope);
        if (!factory) {
            if (this.provider.parent && !sameScope) {
                return this.provider.parent.getRaw(identifier, {
                    sameScope,
                    optional,
                });
            }
            if (optional) {
                return undefined;
            }
            throw new ServiceNotFoundError(identifier);
        }
        return this.provider.cache.getOrInsert(identifier, () => {
            const nextResolver = this.track(identifier);
            try {
                return factory(nextResolver);
            }
            catch (err) {
                if (err instanceof ServiceNotFoundError) {
                    throw new MissingDependencyError(identifier, err.identifier, this.stack);
                }
                throw err;
            }
        });
    }
    track(identifier) {
        const depth = this.depth + 1;
        if (depth >= 100) {
            throw new RecursionLimitError();
        }
        const circular = this.stack.find(i => i.identifierName === identifier.identifierName &&
            i.variant === identifier.variant);
        if (circular) {
            throw new CircularDependencyError([...this.stack, identifier]);
        }
        return new ServiceResolver(this.provider, depth, [
            ...this.stack,
            identifier,
        ]);
    }
}
export class BasicServiceProvider extends ServiceProvider {
    constructor(container, scope, parent) {
        super();
        this.scope = scope;
        this.parent = parent;
        this.cache = new ServiceCachePool();
        this.container = container.clone();
        this.container.addValue(ServiceProvider, this, {
            scope: scope,
            override: true,
        });
    }
    getAllRaw(identifier, options) {
        const resolver = new ServiceResolver(this);
        return resolver.getAllRaw(identifier, options);
    }
    getRaw(identifier, options) {
        const resolver = new ServiceResolver(this);
        return resolver.getRaw(identifier, options);
    }
}
//# sourceMappingURL=provider.js.map