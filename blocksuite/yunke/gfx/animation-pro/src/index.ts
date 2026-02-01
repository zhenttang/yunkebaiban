/**
 * Professional Animation System for BlockSuite
 * 
 * 提供 Procreate 级别的专业动画功能：
 * - WebGL 2.0 高性能渲染
 * - 专业笔刷引擎（压感、平滑、纹理）
 * - 图层系统（混合模式、蒙版、历史）
 * - 帧管理（关键帧、补间、缓动）
 * - 洋葱皮
 * - 多格式导出
 * 
 * @packageDocumentation
 */

// 类型导出
export * from './types/index.js';

// 核心模块
export * from './core/index.js';

// UI 组件
export * from './components/index.js';

// 集成测试
export * from './integration/index.js';

// 版本信息
export const VERSION = '1.0.0';
