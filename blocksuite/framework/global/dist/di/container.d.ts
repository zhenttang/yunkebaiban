import type { ServiceProvider } from './provider.js';
import type { GeneralServiceIdentifier, ServiceFactory, ServiceIdentifier, ServiceIdentifierType, ServiceIdentifierValue, ServiceScope, ServiceVariant, Type, TypesToDeps } from './types.js';
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
export declare class Container {
    private readonly services;
    /**
     * @see {@link ContainerEditor.add}
     */
    get add(): <T extends new (...args: any) => any, const Deps extends TypesToDeps<ConstructorParameters<T>> = TypesToDeps<ConstructorParameters<T>>>(cls: T, ...[deps]: Deps extends [] ? [] : [Deps]) => ContainerEditor;
    /**
     * @see {@link ContainerEditor.addImpl}
     */
    get addImpl(): <Arg1 extends ServiceIdentifier<any>, Arg2 extends Trait | Type<Trait> | ServiceFactory<Trait>, Trait = ServiceIdentifierType<Arg1>, Deps extends Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [] = Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [], Arg3 extends Deps = Deps>(identifier: Arg1, arg2: Arg2, ...[arg3]: Arg3 extends [] ? [] : [Arg3]) => ContainerEditor;
    /**
     * 创建一个空的服务容器。
     *
     * 等同于 `new Container()`
     */
    static get EMPTY(): Container;
    /**
     * @see {@link ContainerEditor.scope}
     */
    get override(): <Arg1 extends ServiceIdentifier<any>, Arg2 extends Trait | Type<Trait> | ServiceFactory<Trait>, Trait = ServiceIdentifierType<Arg1>, Deps extends Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [] = Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [], Arg3 extends Deps = Deps>(identifier: Arg1, arg2: Arg2, ...[arg3]: Arg3 extends [] ? [] : [Arg3]) => ContainerEditor;
    /**
     * @see {@link ContainerEditor.scope}
     */
    get scope(): (scope: ServiceScope) => ContainerEditor;
    /**
     * 容器中服务的数量。
     */
    get size(): number;
    /**
     * @internal Use {@link addImpl} instead.
     */
    addFactory<T>(identifier: GeneralServiceIdentifier<T>, factory: ServiceFactory<T>, { scope, override }?: {
        scope?: ServiceScope;
        override?: boolean;
    }): void;
    /**
     * @internal Use {@link addImpl} instead.
     */
    addValue<T>(identifier: GeneralServiceIdentifier<T>, value: T, { scope, override }?: {
        scope?: ServiceScope;
        override?: boolean;
    }): void;
    /**
     * Clone the entire service container.
     *
     * This method is quite cheap as it only clones the references.
     *
     * @returns A new service container with the same services.
     */
    clone(): Container;
    /**
     * @internal
     */
    getFactory(identifier: ServiceIdentifierValue, scope?: ServiceScope): ServiceFactory | undefined;
    /**
     * @internal
     */
    getFactoryAll(identifier: ServiceIdentifierValue, scope?: ServiceScope): Map<ServiceVariant, ServiceFactory>;
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
    provider(scope?: ServiceScope, parent?: ServiceProvider | null): ServiceProvider;
}
/**
 * A helper class to edit a service container.
 */
declare class ContainerEditor {
    private readonly container;
    private currentScope;
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
    add: <T extends new (...args: any) => any, const Deps extends TypesToDeps<ConstructorParameters<T>> = TypesToDeps<ConstructorParameters<T>>>(cls: T, ...[deps]: Deps extends [] ? [] : [Deps]) => this;
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
    addImpl: <Arg1 extends ServiceIdentifier<any>, Arg2 extends Type<Trait> | ServiceFactory<Trait> | Trait, Trait = ServiceIdentifierType<Arg1>, Deps extends Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [] = Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [], Arg3 extends Deps = Deps>(identifier: Arg1, arg2: Arg2, ...[arg3]: Arg3 extends [] ? [] : [Arg3]) => this;
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
    override: <Arg1 extends ServiceIdentifier<any>, Arg2 extends Type<Trait> | ServiceFactory<Trait> | Trait, Trait = ServiceIdentifierType<Arg1>, Deps extends Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [] = Arg2 extends Type<Trait> ? TypesToDeps<ConstructorParameters<Arg2>> : [], Arg3 extends Deps = Deps>(identifier: Arg1, arg2: Arg2, ...[arg3]: Arg3 extends [] ? [] : [Arg3]) => this;
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
    scope: (scope: ServiceScope) => ContainerEditor;
    constructor(container: Container);
}
export {};
//# sourceMappingURL=container.d.ts.map