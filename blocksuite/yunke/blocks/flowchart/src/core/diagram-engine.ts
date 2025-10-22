/**
 * 图表引擎 - 核心调度器
 * 
 * 提供统一的 API，协调解析器、布局引擎和渲染器
 */

import type { DiagramModel, DiagramType, LayoutType, RenderTarget, RenderConfig } from './diagram-types.js';
import type { LayoutConfig } from './base-layout.js';
import { ParserRegistry } from './base-parser.js';
import { LayoutRegistry } from './base-layout.js';
import { RendererRegistry } from './base-renderer.js';

/**
 * 图表引擎配置
 */
export interface DiagramEngineConfig {
  layout?: LayoutConfig;
  render?: RenderConfig;
}

/**
 * 图表引擎 - 主类
 */
export class DiagramEngine {
  /**
   * 从 DSL 代码生成图表（全流程）
   * 
   * @param dslCode - DSL 代码
   * @param config - 配置选项
   * @returns 渲染结果
   */
  static async generate(
    dslCode: string,
    config?: DiagramEngineConfig
  ) {
    // 1. 解析 DSL
    const model = ParserRegistry.parseAuto(dslCode);
    
    // 2. 计算布局
    const layout = LayoutRegistry.layoutAuto(model, config?.layout);
    
    // 3. 渲染（默认为 SVG）
    const target = config?.render?.target || 'svg';
    const renderResult = RendererRegistry.render(layout, target, config?.render);
    
    return {
      model,
      layout,
      render: renderResult,
    };
  }
  
  /**
   * 仅解析 DSL（不布局、不渲染）
   */
  static parse(dslCode: string): DiagramModel {
    return ParserRegistry.parseAuto(dslCode);
  }
  
  /**
   * 验证 DSL 代码
   */
  static validate(dslCode: string): {
    valid: boolean;
    errors?: Array<{ line: number; message: string }>;
  } {
    try {
      const typeMatch = dslCode.match(/diagram\s+"[^"]+"\s+type\s+"([^"]+)"/);
      const type = typeMatch ? typeMatch[1] as DiagramType : 'flowchart';
      
      const parser = ParserRegistry.get(type);
      if (!parser) {
        return {
          valid: false,
          errors: [{ line: 0, message: `Unsupported diagram type: ${type}` }]
        };
      }
      
      return parser.validate(dslCode);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          line: 0,
          message: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }
  
  /**
   * 获取支持的图表类型列表
   */
  static getSupportedTypes(): {
    parsers: DiagramType[];
    layouts: LayoutType[];
    renderers: RenderTarget[];
  } {
    return {
      parsers: ParserRegistry.list(),
      layouts: LayoutRegistry.list(),
      renderers: RendererRegistry.list(),
    };
  }
  
  /**
   * 检查是否支持某个图表类型
   */
  static isSupported(type: DiagramType): boolean {
    return ParserRegistry.list().includes(type);
  }
}

// 导出所有核心模块
export * from './diagram-types.js';
export * from './base-parser.js';
export * from './base-layout.js';
export * from './base-renderer.js';

