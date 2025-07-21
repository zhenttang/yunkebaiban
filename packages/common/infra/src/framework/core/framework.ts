import type { Entity } from './components/entity';
import type { Scope } from './components/scope';
import type { Service } from './components/service';
import type { Store } from './components/store';
import { DEFAULT_VARIANT, ROOT_SCOPE, SUB_COMPONENTS } from './consts';
import { DuplicateDefinitionError } from './error';
import { parseIdentifier } from './identifier';
import type { FrameworkProvider } from './provider';
import { BasicFrameworkProvider } from './provider';
import { stringifyScope } from './scope';
import type {
  ComponentFactory,
  ComponentVariant,
  FrameworkScopeStack,
  GeneralIdentifier,
  Identifier,
  IdentifierType,
  IdentifierValue,
  SubComponent,
  Type,
  TypesToDeps,
} from './types';

export class Framework {
  private readonly components: Map<
    string,
    Map<string, Map<ComponentVariant, ComponentFactory>>
  > = new Map();

  /**
   * 创建一个空的框架。
   *
   * 等同于 `new Framework()`
   */
  static get EMPTY() {
    return new Framework();
  }

  /**
   * 框架中组件的数量。
   */
  get componentCount() {
    let count = 0;
    for (const [, identifiers] of this.components) {
      for (const [, variants] of identifiers) {
        count += variants.size;
      }
    }
    return count;
  }

  /**
   * @see {@link FrameworkEditor.service}
   */
  get service() {
    return new FrameworkEditor(this).service;
  }

  /**
   * @see {@link FrameworkEditor.impl}
   */
  get impl() {
    return new FrameworkEditor(this).impl;
  }

  /**
   * @see {@link FrameworkEditor.entity}
   */
  get entity() {
    return new FrameworkEditor(this).entity;
  }

  /**
   * @see {@link FrameworkEditor.scope}
   */
  get scope() {
    return new FrameworkEditor(this).scope;
  }

  /**
   * @see {@link FrameworkEditor.override}
   */
  get override() {
    return new FrameworkEditor(this).override;
  }

  /**
   * @see {@link FrameworkEditor.store}
   */
  get store() {
    return new FrameworkEditor(this).store;
  }

  /**
   * @internal 使用 {@link impl} 代替。
   */
  addValue<T>(
    identifier: GeneralIdentifier<T>,
    value: T,
    {
      scope,
      override,
    }: { scope?: FrameworkScopeStack; override?: boolean } = {}
  ) {
    this.addFactory(parseIdentifier(identifier) as Identifier<T>, () => value, {
      scope,
      override,
    });
  }

  /**
   * @internal 使用 {@link impl} 代替。
   */
  addFactory<T>(
    identifier: GeneralIdentifier<T>,
    factory: ComponentFactory<T>,
    {
      scope,
      override,
    }: { scope?: FrameworkScopeStack; override?: boolean } = {}
  ) {
    // 将作用域转换为字符串
    const normalizedScope = stringifyScope(scope ?? ROOT_SCOPE);
    const normalizedIdentifier = parseIdentifier(identifier);
    const normalizedVariant = normalizedIdentifier.variant ?? DEFAULT_VARIANT;

    const services =
      this.components.get(normalizedScope) ??
      new Map<string, Map<ComponentVariant, ComponentFactory>>();

    const variants =
      services.get(normalizedIdentifier.identifierName) ??
      new Map<ComponentVariant, ComponentFactory>();

    // 如果服务已存在则抛出异常，除非是覆盖操作
    if (variants.has(normalizedVariant) && !override) {
      throw new DuplicateDefinitionError(normalizedIdentifier);
    }
    variants.set(normalizedVariant, factory);
    services.set(normalizedIdentifier.identifierName, variants);
    this.components.set(normalizedScope, services);
  }

  remove(identifier: IdentifierValue, scope: FrameworkScopeStack = ROOT_SCOPE) {
    const normalizedScope = stringifyScope(scope);
    const normalizedIdentifier = parseIdentifier(identifier);
    const normalizedVariant = normalizedIdentifier.variant ?? DEFAULT_VARIANT;

    const services = this.components.get(normalizedScope);
    if (!services) {
      return;
    }

    const variants = services.get(normalizedIdentifier.identifierName);
    if (!variants) {
      return;
    }

    variants.delete(normalizedVariant);
  }

  /**
   * 从集合中创建服务提供者。
   *
   * @example
   * ```ts
   * provider() // 为根作用域创建服务提供者
   * provider(ScopeA, parentProvider) // 为作用域A创建服务提供者
   * ```
   *
   * @param scope 服务提供者的作用域，默认为根作用域。
   * @param parent 父级服务提供者，如果作用域不是根作用域则必需。
   */
  provider(
    scope: FrameworkScopeStack = ROOT_SCOPE,
    parent: FrameworkProvider | null = null
  ): FrameworkProvider {
    return new BasicFrameworkProvider(this, scope, parent);
  }

  /**
   * @internal
   */
  getFactory(
    identifier: IdentifierValue,
    scope: FrameworkScopeStack = ROOT_SCOPE
  ): ComponentFactory | undefined {
    return this.components
      .get(stringifyScope(scope))
      ?.get(identifier.identifierName)
      ?.get(identifier.variant ?? DEFAULT_VARIANT);
  }

  /**
   * @internal
   */
  getFactoryAll(
    identifier: IdentifierValue,
    scope: FrameworkScopeStack = ROOT_SCOPE
  ): Map<ComponentVariant, ComponentFactory> {
    return new Map(
      this.components.get(stringifyScope(scope))?.get(identifier.identifierName)
    );
  }

  /**
   * 克隆整个服务集合。
   *
   * 这个方法的开销很小，因为它只克隆引用。
   *
   * @returns 具有相同服务的新服务集合。
   */
  clone(): Framework {
    const di = new Framework();
    for (const [scope, identifiers] of this.components) {
      const s = new Map();
      for (const [identifier, variants] of identifiers) {
        s.set(identifier, new Map(variants));
      }
      di.components.set(scope, s);
    }
    return di;
  }
}

/**
 * 用于编辑框架的辅助类。
 */
class FrameworkEditor {
  private currentScopeStack: FrameworkScopeStack = ROOT_SCOPE;

  constructor(private readonly collection: Framework) {}

  /**
   * 向框架添加服务。
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * service(ServiceClass, [dependencies, ...])
   * ```
   */
  service = <
    Arg1 extends Type<Service>,
    Arg2 extends Deps | ComponentFactory<ServiceType> | ServiceType,
    ServiceType = IdentifierType<Arg1>,
    Deps = Arg1 extends Type<ServiceType>
      ? TypesToDeps<ConstructorParameters<Arg1>>
      : [],
  >(
    service: Arg1,
    ...[arg2]: Arg2 extends [] ? [] : [Arg2]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(service as any, arg2 as any, {
        scope: this.currentScopeStack,
      });
    } else if (arg2 instanceof Array || arg2 === undefined) {
      this.collection.addFactory<any>(
        service as any,
        dependenciesToFactory(service, arg2 as any),
        { scope: this.currentScopeStack }
      );
    } else {
      this.collection.addValue<any>(service as any, arg2, {
        scope: this.currentScopeStack,
      });
    }

    if (SUB_COMPONENTS in service) {
      const subComponents = (service as any)[SUB_COMPONENTS] as SubComponent[];
      for (const { identifier, factory } of subComponents) {
        this.collection.addFactory(identifier, factory, {
          scope: this.currentScopeStack,
        });
      }
    }

    return this;
  };

  /**
   * 向框架添加存储。
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * store(StoreClass, [dependencies, ...])
   * ```
   */
  store = <
    Arg1 extends Type<Store>,
    Arg2 extends Deps | ComponentFactory<StoreType> | StoreType,
    StoreType = IdentifierType<Arg1>,
    Deps = Arg1 extends Type<StoreType>
      ? TypesToDeps<ConstructorParameters<Arg1>>
      : [],
  >(
    store: Arg1,
    ...[arg2]: Arg2 extends [] ? [] : [Arg2]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(store as any, arg2 as any, {
        scope: this.currentScopeStack,
      });
    } else if (arg2 instanceof Array || arg2 === undefined) {
      this.collection.addFactory<any>(
        store as any,
        dependenciesToFactory(store, arg2 as any),
        { scope: this.currentScopeStack }
      );
    } else {
      this.collection.addValue<any>(store as any, arg2, {
        scope: this.currentScopeStack,
      });
    }

    if (SUB_COMPONENTS in store) {
      const subComponents = (store as any)[SUB_COMPONENTS] as SubComponent[];
      for (const { identifier, factory } of subComponents) {
        this.collection.addFactory(identifier, factory, {
          scope: this.currentScopeStack,
        });
      }
    }

    return this;
  };

  /**
   * 向框架添加实体。
   */
  entity = <
    Arg1 extends Type<Entity<any>>,
    Arg2 extends Deps | ComponentFactory<EntityType>,
    EntityType = IdentifierType<Arg1>,
    Deps = Arg1 extends Type<EntityType>
      ? TypesToDeps<ConstructorParameters<Arg1>>
      : [],
  >(
    entity: Arg1,
    ...[arg2]: Arg2 extends [] ? [] : [Arg2]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(entity as any, arg2 as any, {
        scope: this.currentScopeStack,
      });
    } else {
      this.collection.addFactory<any>(
        entity as any,
        dependenciesToFactory(entity, arg2 as any),
        { scope: this.currentScopeStack }
      );
    }

    return this;
  };

  /**
   * 为标识符向集合添加实现。
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * addImpl(Identifier, Class, [dependencies, ...])
   * or
   * addImpl(Identifier, Instance)
   * or
   * addImpl(Identifier, Factory)
   * ```
   */
  impl = <
    Arg1 extends Identifier<any>,
    Arg2 extends Type<Trait> | ComponentFactory<Trait> | Trait,
    Arg3 extends Deps,
    Trait = IdentifierType<Arg1>,
    Deps = Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [],
  >(
    identifier: Arg1,
    arg2: Arg2,
    ...[arg3]: Arg3 extends [] ? [] : [Arg3]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(
        identifier,
        dependenciesToFactory(arg2, arg3 as any[]),
        { scope: this.currentScopeStack }
      );
    } else {
      this.collection.addValue(identifier, arg2 as any, {
        scope: this.currentScopeStack,
      });
    }

    return this;
  };

  /**
   * 与 {@link impl} 相同，但如果组件已存在，此方法会覆盖它。
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * override(Identifier, Class, [dependencies, ...])
   * or
   * override(Identifier, Instance)
   * or
   * override(Identifier, Factory)
   * ```
   */
  override = <
    Arg1 extends Identifier<any>,
    Arg2 extends Type<Trait> | ComponentFactory<Trait> | Trait,
    Arg3 extends Deps,
    Trait = IdentifierType<Arg1>,
    Deps = Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [],
  >(
    identifier: Arg1,
    arg2: Arg2,
    ...[arg3]: Arg3 extends [] ? [] : [Arg3]
  ): this => {
    if (arg2 === null) {
      this.collection.remove(
        parseIdentifier(identifier),
        this.currentScopeStack
      );
      return this;
    } else if (arg2 instanceof Function) {
      this.collection.addFactory<any>(
        identifier,
        dependenciesToFactory(arg2, arg3 as any[]),
        { scope: this.currentScopeStack, override: true }
      );
    } else {
      this.collection.addValue(identifier, arg2 as any, {
        scope: this.currentScopeStack,
        override: true,
      });
    }

    return this;
  };

  /**
   * 设置后续注册服务的作用域
   *
   * @example
   *
   * ```ts
   * const ScopeA = createScope('a');
   *
   * services.scope(ScopeA).add(XXXService, ...);
   * ```
   */
  scope = (scope: Type<Scope<any>>): this => {
    this.currentScopeStack = [
      ...this.currentScopeStack,
      parseIdentifier(scope).identifierName,
    ];

    this.collection.addFactory<any>(
      scope as any,
      dependenciesToFactory(scope, [] as any),
      { scope: this.currentScopeStack, override: true }
    );

    return this;
  };
}

/**
 * 将依赖定义转换为工厂函数。
 */
function dependenciesToFactory(
  cls: any,
  deps: any[] = []
): ComponentFactory<any> {
  return (provider: FrameworkProvider) => {
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
      } else {
        isAll = false;
        identifier = dep;
      }
      if (isAll) {
        args.push(Array.from(provider.getAll(identifier).values()));
      } else {
        args.push(provider.get(identifier));
      }
    }
    if (isConstructor(cls)) {
      return new cls(...args, provider);
    } else {
      return cls(...args, provider);
    }
  };
}

// 用于检查函数是否为构造函数的技巧
// https://github.com/zloirock/core-js/blob/232c8462c26c75864b4397b7f643a4f57c6981d5/packages/core-js/internals/is-constructor.js#L15
function isConstructor(cls: any) {
  try {
    Reflect.construct(function () {}, [], cls);
    return true;
  } catch {
    return false;
  }
}
