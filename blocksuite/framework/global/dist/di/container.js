import { DEFAULT_SERVICE_VARIANT, ROOT_SCOPE } from './consts.js';
import { DuplicateServiceDefinitionError } from './error.js';
import { parseIdentifier } from './identifier.js';
import { BasicServiceProvider } from './provider.js';
import { stringifyScope } from './scope.js';
/**
 * 服务容器。
 *
 * 容器本质上是一个包含 `[作用域, 标识符, 变体, 工厂]` 的元组，以及一些辅助方法。
 * 它仅存储服务的定义，从不持有任何服务实例。
 *
 * # 用法
 *
 * ```ts
 * const services = new Container();
 * class ServiceA {
 *   // ...
 * }
 * // 添加一个服务
 * services.add(ServiceA);
 *
 * class ServiceB {
 *   constructor(serviceA: ServiceA) {}
 * }
 * // 添加带依赖的服务
 * services.add(ServiceB, [ServiceA]);
 *                         ^ 依赖类/标识符，与 ServiceB 的构造函数匹配
 *
 * const FeatureA = createIdentifier<FeatureA>('Config');
 *
 * // 为服务标识符添加实现
 * services.addImpl(FeatureA, ServiceA);
 *
 * // 覆盖一个服务
 * services.override(ServiceA, NewServiceA);
 *
 * // 创建服务提供者
 * const provider = services.provider();
 * ```
 *
 * # 数据结构
 *
 * Container 的数据结构是一个三层嵌套的 Map，用于表示元组
 * `[作用域, 标识符, 变体, 工厂]`。
 * 这种数据结构确保服务工厂可以通过 `[作用域, 标识符, 变体]` 唯一确定。
 *
 * 当添加服务时：
 *
 * ```ts
 * services.add(ServiceClass)
 * ```
 *
 * 数据结构将是：
 *
 * ```ts
 * Map {
 *  '': Map {                      // 作用域
 *   'ServiceClass': Map {         // 标识符
 *     'default':                  // 变体
 *        () => new ServiceClass() // 工厂
 *  }
 * }
 * ```
 *
 * # 依赖关系
 *
 * 服务的依赖关系实际上不存储在 Container 中，
 * 而是在添加服务时转换为工厂函数。
 *
 * 例如：
 *
 * ```ts
 * services.add(ServiceB, [ServiceA]);
 *
 * // 等价于
 * services.addFactory(ServiceB, (provider) => new ServiceB(provider.get(ServiceA)));
 * ```
 *
 * 对于同一服务标识符的多个实现，可以定义为：
 *
 * ```ts
 * services.add(ServiceB, [[FeatureA]]);
 *
 * // 等价于
 * services.addFactory(ServiceB, (provider) => new ServiceB(provider.getAll(FeatureA)));
 * ```
 */
export class Container {
    constructor() {
        this.services = new Map();
    }
    /**
     * @see {@link ContainerEditor.add}
     */
    get add() {
        return new ContainerEditor(this).add;
    }
    /**
     * @see {@link ContainerEditor.addImpl}
     */
    get addImpl() {
        return new ContainerEditor(this).addImpl;
    }
    /**
     * 创建一个空的服务容器。
     *
     * 等同于 `new Container()`
     */
    static get EMPTY() {
        return new Container();
    }
    /**
     * @see {@link ContainerEditor.scope}
     */
    get override() {
        return new ContainerEditor(this).override;
    }
    /**
     * @see {@link ContainerEditor.scope}
     */
    get scope() {
        return new ContainerEditor(this).scope;
    }
    /**
     * 容器中服务的数量。
     */
    get size() {
        let size = 0;
        for (const [, identifiers] of this.services) {
            for (const [, variants] of identifiers) {
                size += variants.size;
            }
        }
        return size;
    }
    /**
     * @internal Use {@link addImpl} instead.
     */
    addFactory(identifier, factory, { scope, override } = {}) {
        // convert scope to string
        const normalizedScope = stringifyScope(scope ?? ROOT_SCOPE);
        const normalizedIdentifier = parseIdentifier(identifier);
        const normalizedVariant = normalizedIdentifier.variant ?? DEFAULT_SERVICE_VARIANT;
        const services = this.services.get(normalizedScope) ??
            new Map();
        const variants = services.get(normalizedIdentifier.identifierName) ??
            new Map();
        // throw if service already exists, unless it is an override
        if (variants.has(normalizedVariant) && !override) {
            throw new DuplicateServiceDefinitionError(normalizedIdentifier);
        }
        variants.set(normalizedVariant, factory);
        services.set(normalizedIdentifier.identifierName, variants);
        this.services.set(normalizedScope, services);
    }
    /**
     * @internal Use {@link addImpl} instead.
     */
    addValue(identifier, value, { scope, override } = {}) {
        this.addFactory(parseIdentifier(identifier), () => value, {
            scope,
            override,
        });
    }
    /**
     * Clone the entire service container.
     *
     * This method is quite cheap as it only clones the references.
     *
     * @returns A new service container with the same services.
     */
    clone() {
        const di = new Container();
        for (const [scope, identifiers] of this.services) {
            const s = new Map();
            for (const [identifier, variants] of identifiers) {
                s.set(identifier, new Map(variants));
            }
            di.services.set(scope, s);
        }
        return di;
    }
    /**
     * @internal
     */
    getFactory(identifier, scope = ROOT_SCOPE) {
        return this.services
            .get(stringifyScope(scope))
            ?.get(identifier.identifierName)
            ?.get(identifier.variant ?? DEFAULT_SERVICE_VARIANT);
    }
    /**
     * @internal
     */
    getFactoryAll(identifier, scope = ROOT_SCOPE) {
        return new Map(this.services.get(stringifyScope(scope))?.get(identifier.identifierName));
    }
    /**
     * Create a service provider from the container.
     *
     * @example
     * ```ts
     * provider() // create a service provider for root scope
     * provider(ScopeA, parentProvider) // create a service provider for scope A
     * ```
     *
     * @param scope The scope of the service provider, default to the root scope.
     * @param parent The parent service provider, it is required if the scope is not the root scope.
     */
    provider(scope = ROOT_SCOPE, parent = null) {
        return new BasicServiceProvider(this, scope, parent);
    }
}
/**
 * A helper class to edit a service container.
 */
class ContainerEditor {
    constructor(container) {
        this.container = container;
        this.currentScope = ROOT_SCOPE;
        /**
         * Add a service to the container.
         *
         * @see {@link Container}
         *
         * @example
         * ```ts
         * add(ServiceClass, [dependencies, ...])
         * ```
         */
        this.add = (cls, ...[deps]) => {
            this.container.addFactory(cls, dependenciesToFactory(cls, deps), { scope: this.currentScope });
            return this;
        };
        /**
         * Add an implementation for identifier to the container.
         *
         * @see {@link Container}
         *
         * @example
         * ```ts
         * addImpl(ServiceIdentifier, ServiceClass, [dependencies, ...])
         * or
         * addImpl(ServiceIdentifier, Instance)
         * or
         * addImpl(ServiceIdentifier, Factory)
         * ```
         */
        this.addImpl = (identifier, arg2, ...[arg3]) => {
            if (arg2 instanceof Function) {
                this.container.addFactory(identifier, dependenciesToFactory(arg2, arg3), { scope: this.currentScope });
            }
            else {
                this.container.addValue(identifier, arg2, {
                    scope: this.currentScope,
                });
            }
            return this;
        };
        /**
         * same as {@link addImpl} but this method will override the service if it exists.
         *
         * @see {@link Container}
         *
         * @example
         * ```ts
         * override(OriginServiceClass, NewServiceClass, [dependencies, ...])
         * or
         * override(ServiceIdentifier, ServiceClass, [dependencies, ...])
         * or
         * override(ServiceIdentifier, Instance)
         * or
         * override(ServiceIdentifier, Factory)
         * ```
         */
        this.override = (identifier, arg2, ...[arg3]) => {
            if (arg2 instanceof Function) {
                this.container.addFactory(identifier, dependenciesToFactory(arg2, arg3), { scope: this.currentScope, override: true });
            }
            else {
                this.container.addValue(identifier, arg2, {
                    scope: this.currentScope,
                    override: true,
                });
            }
            return this;
        };
        /**
         * Set the scope for the service registered subsequently
         *
         * @example
         *
         * ```ts
         * const ScopeA = createScope('a');
         *
         * services.scope(ScopeA).add(XXXService, ...);
         * ```
         */
        this.scope = (scope) => {
            this.currentScope = scope;
            return this;
        };
    }
}
/**
 * Convert dependencies definition to a factory function.
 */
function dependenciesToFactory(cls, deps = []) {
    return (provider) => {
        const args = [];
        for (const dep of deps) {
            let isAll;
            let identifier;
            if (Array.isArray(dep)) {
                if (dep.length !== 1) {
                    throw new Error('无效的依赖');
                }
                isAll = true;
                identifier = dep[0];
            }
            else {
                isAll = false;
                identifier = dep;
            }
            if (isAll) {
                args.push(Array.from(provider.getAll(identifier).values()));
            }
            else {
                args.push(provider.get(identifier));
            }
        }
        if (isConstructor(cls)) {
            return new cls(...args, provider);
        }
        else {
            return cls(...args, provider);
        }
    };
}
// a hack to check if a function is a constructor
// https://github.com/zloirock/core-js/blob/232c8462c26c75864b4397b7f643a4f57c6981d5/packages/core-js/internals/is-constructor.js#L15
function isConstructor(cls) {
    try {
        Reflect.construct(function () { }, [], cls);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=container.js.map