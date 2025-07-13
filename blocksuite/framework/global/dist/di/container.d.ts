import type { ServiceProvider } from './provider.js';
import type { GeneralServiceIdentifier, ServiceFactory, ServiceIdentifier, ServiceIdentifierType, ServiceIdentifierValue, ServiceScope, ServiceVariant, Type, TypesToDeps } from './types.js';
/**
 * A container of services.
 *
 * Container basically is a tuple of `[scope, identifier, variant, factory]` with some helper methods.
 * It just stores the definitions of services. It never holds any instances of services.
 *
 * # Usage
 *
 * ```ts
 * const services = new Container();
 * class ServiceA {
 *   // ...
 * }
 * // add a service
 * services.add(ServiceA);
 *
 * class ServiceB {
 *   constructor(serviceA: ServiceA) {}
 * }
 * // add a service with dependency
 * services.add(ServiceB, [ServiceA]);
 *                         ^ dependency class/identifier, match ServiceB's constructor
 *
 * const FeatureA = createIdentifier<FeatureA>('Config');
 *
 * // add a implementation for a service identifier
 * services.addImpl(FeatureA, ServiceA);
 *
 * // override a service
 * services.override(ServiceA, NewServiceA);
 *
 * // create a service provider
 * const provider = services.provider();
 * ```
 *
 * # The data structure
 *
 * The data structure of Container is a three-layer nested Map, used to represent the tuple of
 * `[scope, identifier, variant, factory]`.
 * Such a data structure ensures that a service factory can be uniquely determined by `[scope, identifier, variant]`.
 *
 * When a service added:
 *
 * ```ts
 * services.add(ServiceClass)
 * ```
 *
 * The data structure will be:
 *
 * ```ts
 * Map {
 *  '': Map {                      // scope
 *   'ServiceClass': Map {         // identifier
 *     'default':                  // variant
 *        () => new ServiceClass() // factory
 *  }
 * }
 * ```
 *
 * # Dependency relationship
 *
 * The dependency relationships of services are not actually stored in the Container,
 * but are transformed into a factory function when the service is added.
 *
 * For example:
 *
 * ```ts
 * services.add(ServiceB, [ServiceA]);
 *
 * // is equivalent to
 * services.addFactory(ServiceB, (provider) => new ServiceB(provider.get(ServiceA)));
 * ```
 *
 * For multiple implementations of the same service identifier, can be defined as:
 *
 * ```ts
 * services.add(ServiceB, [[FeatureA]]);
 *
 * // is equivalent to
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
     * Create an empty service container.
     *
     * same as `new Container()`
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
     * The number of services in the container.
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