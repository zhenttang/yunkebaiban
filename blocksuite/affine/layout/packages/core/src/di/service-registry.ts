import { ServiceContainer, ServiceTokens } from './service-container.js';
import type { 
  IPageLayoutService, 
  IStorageService, 
  IColumnDistributor 
} from '../types/contracts.js';

/**
 * 服务注册器 - 负责注册所有核心服务
 */
export class ServiceRegistry {
  /**
   * 注册核心服务 (供开发者A1, A2, A3 使用)
   */
  static registerCoreServices(container: ServiceContainer, useMocks = false): void {
    if (useMocks) {
      // 注册Mock服务 (Day 3-4 使用)
      console.log('🔧 注册Mock服务...');
      
      // 动态导入Mock服务 (避免在真实环境中加载)
      container.registerFactory(ServiceTokens.PAGE_LAYOUT_SERVICE, () => {
        // 这里会在Day 3-4实现MockPageLayoutService
        const { MockPageLayoutService } = require('../mocks/mock-services.js');
        return new MockPageLayoutService();
      });
      
      container.registerFactory(ServiceTokens.STORAGE_SERVICE, () => {
        const { MockStorageService } = require('../mocks/mock-services.js');
        return new MockStorageService();
      });
      
      container.registerFactory(ServiceTokens.COLUMN_DISTRIBUTOR, () => {
        const { MockColumnDistributor } = require('../mocks/mock-services.js');
        return new MockColumnDistributor();
      });
      
    } else {
      // 注册真实服务 (Day 5-6 使用)
      console.log('🚀 注册真实服务...');
      
      container.registerFactory(ServiceTokens.STORAGE_SERVICE, () => {
        const { StorageService } = require('../services/storage-service.js');
        return new StorageService();
      });
      
      container.registerFactory(ServiceTokens.COLUMN_DISTRIBUTOR, () => {
        const { ColumnDistributor } = require('../services/column-distributor.js');
        return new ColumnDistributor();
      });
      
      container.registerFactory(ServiceTokens.PAGE_LAYOUT_SERVICE, () => {
        const { PageLayoutService } = require('../services/page-layout-service.js');
        const storage = container.get<IStorageService>(ServiceTokens.STORAGE_SERVICE);
        const distributor = container.get<IColumnDistributor>(ServiceTokens.COLUMN_DISTRIBUTOR);
        return new PageLayoutService(storage, distributor);
      });
    }
  }

  /**
   * 注册交互功能服务 (供开发者C1, C2 使用)
   */
  static registerInteractionServices(container: ServiceContainer, useMocks = false): void {
    if (useMocks) {
      console.log('🎭 注册Mock交互服务...');
      
      container.registerFactory(ServiceTokens.ANIMATION_MANAGER, () => {
        const { MockAnimationManager } = require('../mocks/mock-interactions.js');
        return new MockAnimationManager();
      });
      
      container.registerFactory(ServiceTokens.RESPONSIVE_MANAGER, () => {
        const { MockResponsiveManager } = require('../mocks/mock-interactions.js');
        return new MockResponsiveManager();
      });
      
      container.registerFactory(ServiceTokens.COLUMN_RESIZER, () => {
        const { MockColumnResizer } = require('../mocks/mock-interactions.js');
        return new MockColumnResizer();
      });
      
    } else {
      console.log('✨ 注册真实交互服务...');
      
      container.registerFactory(ServiceTokens.ANIMATION_MANAGER, () => {
        const { AnimationManager } = require('../../interactions/src/animation/animation-manager.js');
        return new AnimationManager();
      });
      
      container.registerFactory(ServiceTokens.RESPONSIVE_MANAGER, () => {
        const { ResponsiveManager } = require('../../interactions/src/responsive/responsive-manager.js');
        return new ResponsiveManager();
      });
      
      container.registerFactory(ServiceTokens.COLUMN_RESIZER, () => {
        const { ColumnResizer } = require('../../interactions/src/resizer/column-resizer.js');
        return new ColumnResizer();
      });
    }
  }

  /**
   * 一键设置开发环境 (供所有开发者使用)
   */
  static setupDevelopmentEnvironment(container: ServiceContainer): void {
    // 开发阶段使用Mock服务
    this.registerCoreServices(container, true);
    this.registerInteractionServices(container, true);
    
    console.log('🛠️ 开发环境已就绪，Mock服务已加载');
    console.log('📋 可用服务:', container.getRegisteredTokens());
  }

  /**
   * 一键设置生产环境
   */
  static setupProductionEnvironment(container: ServiceContainer): void {
    // 生产环境使用真实服务
    this.registerCoreServices(container, false);
    this.registerInteractionServices(container, false);
    
    console.log('🚀 生产环境已就绪，真实服务已加载');
  }

  /**
   * 切换到真实服务 (开发完成后调用)
   */
  static switchToRealServices(container: ServiceContainer): void {
    console.log('🔄 切换到真实服务...');
    
    // 清空现有服务
    container.clear();
    
    // 重新注册真实服务
    this.setupProductionEnvironment(container);
    
    console.log('✅ 已切换到真实服务');
  }
}

/**
 * 服务健康检查
 */
export class ServiceHealthChecker {
  static checkServices(container: ServiceContainer): HealthCheckResult {
    const results: ServiceHealthStatus[] = [];
    const tokens = container.getRegisteredTokens();
    
    for (const token of tokens) {
      try {
        const service = container.get(token);
        results.push({
          token,
          status: 'healthy',
          message: `${token} service is working`,
          service
        });
      } catch (error) {
        results.push({
          token,
          status: 'error',
          message: `${token} service failed: ${error}`,
          error: error as Error
        });
      }
    }
    
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    return {
      overall: healthyCount === totalCount ? 'healthy' : 'degraded',
      services: results,
      summary: `${healthyCount}/${totalCount} services healthy`
    };
  }
}

interface ServiceHealthStatus {
  token: string;
  status: 'healthy' | 'error';
  message: string;
  service?: any;
  error?: Error;
}

interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceHealthStatus[];
  summary: string;
}