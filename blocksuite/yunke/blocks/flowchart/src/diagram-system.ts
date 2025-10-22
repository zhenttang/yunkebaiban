/**
 * 图表系统初始化和注册
 * 
 * 这个文件负责注册所有的解析器、布局引擎和渲染器
 */

import { ParserRegistry, LayoutRegistry, RendererRegistry } from './core/diagram-engine.js';

// 导入解析器
import { LayeredParser } from './parsers/layered-parser.js';
import { TreeParser } from './parsers/tree-parser.js';

// 导入布局引擎
import { LayeredLayoutEngine } from './layouts/layered-layout.js';
import { TreeLayoutEngine } from './layouts/tree-layout.js';

// 导入渲染器
import { SVGRendererV2 } from './renderers/svg-renderer-v2.js';

/**
 * 初始化图表系统
 * 注册所有可用的解析器、布局引擎和渲染器
 */
export function initializeDiagramSystem() {
  // ===== 注册解析器 =====
  ParserRegistry.register(new LayeredParser());
  ParserRegistry.register(new TreeParser());
  
  // ===== 注册布局引擎 =====
  LayoutRegistry.register(new LayeredLayoutEngine());
  LayoutRegistry.register(new TreeLayoutEngine());
  
  // ===== 注册渲染器 =====
  RendererRegistry.register(new SVGRendererV2());
  // 注意：EdgelessRenderer 需要 surface 实例，所以在使用时动态创建
  
  console.log('✅ 图表系统已初始化');
  console.log('📊 支持的图表类型:', ParserRegistry.list());
  console.log('📐 支持的布局引擎:', LayoutRegistry.list());
  console.log('🎨 支持的渲染器:', RendererRegistry.list());
}

// 自动初始化（可选）
if (typeof window !== 'undefined') {
  // 在浏览器环境中自动初始化
  initializeDiagramSystem();
}

// 导出核心模块
export * from './core/diagram-engine.js';
export { LayeredParser } from './parsers/layered-parser.js';
export { TreeParser } from './parsers/tree-parser.js';
export { LayeredLayoutEngine } from './layouts/layered-layout.js';
export { TreeLayoutEngine } from './layouts/tree-layout.js';
export { SVGRendererV2 } from './renderers/svg-renderer-v2.js';
export { EdgelessRenderer, generateDiagramToEdgeless } from './renderers/edgeless-renderer.js';

