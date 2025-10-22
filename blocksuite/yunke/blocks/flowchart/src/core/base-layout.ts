/**
 * 基础布局引擎 - 所有布局算法的父类
 * 
 * 职责：计算图表元素的位置和大小
 */

import type {
  DiagramModel,
  LayoutType,
  LayoutResult,
  LayoutedElement,
  LayoutedRelationship,
  Position,
  Size,
  Bounds
} from './diagram-types.js';

/**
 * 布局配置接口
 */
export interface LayoutConfig {
  // 节点尺寸
  nodeWidth?: number;
  nodeHeight?: number;
  
  // 间距
  nodeSpacing?: number;      // 节点之间的间距
  rankSpacing?: number;      // 层级之间的间距
  
  // 边距
  padding?: number;
  
  // 其他自定义配置
  [key: string]: any;
}

/**
 * 布局引擎接口
 */
export interface ILayoutEngine {
  /**
   * 布局引擎支持的类型
   */
  readonly supportedType: LayoutType;
  
  /**
   * 计算布局
   * @param model - 图表模型
   * @param config - 布局配置
   * @returns 布局结果
   */
  layout(model: DiagramModel, config?: LayoutConfig): LayoutResult;
}

/**
 * 基础布局引擎抽象类
 */
export abstract class BaseLayoutEngine implements ILayoutEngine {
  abstract readonly supportedType: LayoutType;
  
  /**
   * 默认配置
   */
  protected defaultConfig: Required<LayoutConfig> = {
    nodeWidth: 180,
    nodeHeight: 80,
    nodeSpacing: 80,
    rankSpacing: 120,
    padding: 40,
  };
  
  /**
   * 布局主方法
   */
  abstract layout(model: DiagramModel, config?: LayoutConfig): LayoutResult;
  
  /**
   * 合并配置
   */
  protected mergeConfig(config?: LayoutConfig): Required<LayoutConfig> {
    return {
      ...this.defaultConfig,
      ...config,
    };
  }
  
  /**
   * 工具方法：计算边界框
   */
  protected calculateBounds(elements: LayoutedElement[]): Bounds {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    elements.forEach(elem => {
      minX = Math.min(minX, elem.position.x);
      minY = Math.min(minY, elem.position.y);
      maxX = Math.max(maxX, elem.position.x + elem.size.width);
      maxY = Math.max(maxY, elem.position.y + elem.size.height);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  
  /**
   * 工具方法：计算两点之间的直线路径
   */
  protected calculateStraightPath(
    from: Position & Size,
    to: Position & Size
  ): Position[] {
    return [
      { x: from.x + from.width, y: from.y + from.height / 2 },
      { x: to.x, y: to.y + to.height / 2 },
    ];
  }
  
  /**
   * 工具方法：计算正交路径（横平竖直）
   */
  protected calculateOrthogonalPath(
    from: Position & Size,
    to: Position & Size
  ): Position[] {
    const start = { x: from.x + from.width, y: from.y + from.height / 2 };
    const end = { x: to.x, y: to.y + to.height / 2 };
    
    const midX = (start.x + end.x) / 2;
    
    return [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end,
    ];
  }
  
  /**
   * 工具方法：为元素分配默认尺寸
   */
  protected assignDefaultSizes(
    elements: DiagramModel['elements'],
    config: Required<LayoutConfig>
  ): Array<DiagramModel['elements'][0] & { size: Size }> {
    return elements.map(elem => ({
      ...elem,
      size: elem.size || {
        width: config.nodeWidth,
        height: config.nodeHeight,
      },
    }));
  }
}

/**
 * 布局引擎注册表
 */
export class LayoutRegistry {
  private static engines = new Map<LayoutType, ILayoutEngine>();
  
  /**
   * 注册布局引擎
   */
  static register(engine: ILayoutEngine): void {
    this.engines.set(engine.supportedType, engine);
  }
  
  /**
   * 获取布局引擎
   */
  static get(type: LayoutType): ILayoutEngine | undefined {
    return this.engines.get(type);
  }
  
  /**
   * 根据图表模型自动选择布局引擎
   */
  static layoutAuto(model: DiagramModel, config?: LayoutConfig): LayoutResult {
    const layoutType = model.config.layout;
    const engine = this.get(layoutType);
    
    if (!engine) {
      throw new Error(`No layout engine found for type: ${layoutType}`);
    }
    
    return engine.layout(model, config);
  }
  
  /**
   * 列出所有已注册的布局引擎
   */
  static list(): LayoutType[] {
    return Array.from(this.engines.keys());
  }
}

