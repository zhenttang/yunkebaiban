/**
 * 服务容器 - 简单的依赖注入实现
 */
export class ServiceContainer {
  private services = new Map<string | symbol, any>();
  private factories = new Map<string | symbol, () => any>();
  private singletons = new Set<string | symbol>();

  /**
   * 注册服务实例
   */
  register<T>(token: string | symbol, instance: T): void {
    this.services.set(token, instance);
  }

  /**
   * 注册服务工厂函数
   */
  registerFactory<T>(token: string | symbol, factory: () => T, singleton = true): void {
    this.factories.set(token, factory);
    if (singleton) {
      this.singletons.add(token);
    }
  }

  /**
   * 获取服务实例
   */
  get<T>(token: string | symbol): T {
    // 首先检查已注册的实例
    if (this.services.has(token)) {
      return this.services.get(token) as T;
    }

    // 检查工厂函数
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!;
      const instance = factory() as T;
      
      // 如果是单例，缓存实例
      if (this.singletons.has(token)) {
        this.services.set(token, instance);
      }
      
      return instance;
    }

    throw new Error(`Service not found for token: ${String(token)}`);
  }

  /**
   * 检查服务是否已注册
   */
  has(token: string | symbol): boolean {
    return this.services.has(token) || this.factories.has(token);
  }

  /**
   * 移除服务
   */
  remove(token: string | symbol): boolean {
    const hadService = this.services.delete(token);
    const hadFactory = this.factories.delete(token);
    this.singletons.delete(token);
    return hadService || hadFactory;
  }

  /**
   * 清空所有服务
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * 获取所有注册的令牌
   */
  getTokens(): (string | symbol)[] {
    const tokens = new Set<string | symbol>();
    this.services.forEach((_, token) => tokens.add(token));
    this.factories.forEach((_, token) => tokens.add(token));
    return Array.from(tokens);
  }
}

/**
 * 全局服务容器实例
 */
export const serviceContainer = new ServiceContainer();

/**
 * 服务定位器模式实现
 */
export class ServiceLocator {
  private static container = serviceContainer;

  /**
   * 获取服务实例
   */
  static get<T>(token: string | symbol): T {
    return this.container.get<T>(token);
  }

  /**
   * 注册服务
   */
  static register<T>(token: string | symbol, instance: T): void {
    this.container.register(token, instance);
  }

  /**
   * 注册工厂函数
   */
  static registerFactory<T>(token: string | symbol, factory: () => T, singleton = true): void {
    this.container.registerFactory(token, factory, singleton);
  }

  /**
   * 设置容器
   */
  static setContainer(container: ServiceContainer): void {
    this.container = container;
  }

  /**
   * 获取容器
   */
  static getContainer(): ServiceContainer {
    return this.container;
  }
}

/**
 * 服务配置接口
 */
export interface ServiceConfiguration {
  token: string | symbol;
  implementation?: any;
  factory?: () => any;
  singleton?: boolean;
  dependencies?: (string | symbol)[];
}

/**
 * 服务配置器
 */
export class ServiceConfigurator {
  private configurations: ServiceConfiguration[] = [];

  /**
   * 添加服务配置
   */
  addService(config: ServiceConfiguration): this {
    this.configurations.push(config);
    return this;
  }

  /**
   * 批量配置服务
   */
  configure(container: ServiceContainer = serviceContainer): void {
    // 按依赖关系排序
    const sortedConfigs = this.sortByDependencies();
    
    for (const config of sortedConfigs) {
      if (config.implementation) {
        // 直接实例注册
        container.register(config.token, config.implementation);
      } else if (config.factory) {
        // 工厂函数注册
        container.registerFactory(
          config.token,
          config.factory,
          config.singleton ?? true
        );
      }
    }
  }

  /**
   * 按依赖关系对配置进行排序
   */
  private sortByDependencies(): ServiceConfiguration[] {
    const sorted: ServiceConfiguration[] = [];
    const visited = new Set<string | symbol>();
    const visiting = new Set<string | symbol>();

    const visit = (config: ServiceConfiguration) => {
      if (visiting.has(config.token)) {
        throw new Error(`Circular dependency detected: ${String(config.token)}`);
      }
      if (visited.has(config.token)) {
        return;
      }

      visiting.add(config.token);

      // 处理依赖
      if (config.dependencies) {
        for (const dep of config.dependencies) {
          const depConfig = this.configurations.find(c => c.token === dep);
          if (depConfig) {
            visit(depConfig);
          }
        }
      }

      visiting.delete(config.token);
      visited.add(config.token);
      sorted.push(config);
    };

    for (const config of this.configurations) {
      visit(config);
    }

    return sorted;
  }

  /**
   * 清空配置
   */
  clear(): void {
    this.configurations = [];
  }
}

/**
 * 生命周期管理器
 */
export class LifecycleManager {
  private initializables: Array<{ instance: any; priority: number }> = [];
  private disposables: Array<{ instance: any; priority: number }> = [];

  /**
   * 注册可初始化的服务
   */
  registerInitializable(instance: any, priority = 0): void {
    this.initializables.push({ instance, priority });
    // 按优先级排序
    this.initializables.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 注册可销毁的服务
   */
  registerDisposable(instance: any, priority = 0): void {
    this.disposables.push({ instance, priority });
    // 按优先级排序（销毁时反序）
    this.disposables.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    for (const { instance } of this.initializables) {
      if (typeof instance.initialize === 'function') {
        await instance.initialize();
      }
    }
  }

  /**
   * 销毁所有服务
   */
  async dispose(): Promise<void> {
    for (const { instance } of this.disposables) {
      if (typeof instance.dispose === 'function') {
        await instance.dispose();
      }
    }
  }
}