/**
 * BlockSuite Layout Core Package
 * 核心服务层 - 为其他开发者提供基础架构
 */

// 核心类型定义
export * from './types/layout.js';
export * from './types/contracts.js';

// 依赖注入系统
export * from './di/service-container.js';
export * from './di/service-registry.js';

// 版本信息
export const VERSION = '1.0.0';

/**
 * 快速启动函数 (供其他开发者使用)
 */
export function initializeLayoutSystem() {
  const { container, ServiceRegistry } = require('./di/service-registry.js');
  
  // 设置开发环境 (使用Mock服务)
  ServiceRegistry.setupDevelopmentEnvironment(container);
  
  return {
    container,
    registry: ServiceRegistry,
    version: VERSION
  };
}

/**
 * 获取服务实例的便捷函数
 */
export function getLayoutService() {
  const { container, ServiceTokens } = require('./di/service-container.js');
  return container.get(ServiceTokens.PAGE_LAYOUT_SERVICE);
}

export function getStorageService() {
  const { container, ServiceTokens } = require('./di/service-container.js');
  return container.get(ServiceTokens.STORAGE_SERVICE);
}

export function getColumnDistributor() {
  const { container, ServiceTokens } = require('./di/service-container.js');
  return container.get(ServiceTokens.COLUMN_DISTRIBUTOR);
}