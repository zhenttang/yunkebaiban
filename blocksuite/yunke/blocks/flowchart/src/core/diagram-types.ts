/**
 * 通用图表系统 - 核心类型定义
 * 
 * 这是整个图表系统的基石，定义了所有图表的通用数据结构
 */

// ==================== 图表类型 ====================

export type DiagramType = 
  | 'flowchart'        // 流程图
  | 'layered'          // 分层架构图
  | 'sequence'         // 时序图
  | 'swimlane'         // 泳道图
  | 'tree'             // 树状图（组织结构图）
  | 'er'               // ER图（实体关系图）
  | 'gantt'            // 甘特图
  | 'network'          // 网络拓扑图
  | 'mindmap';         // 思维导图

// ==================== 布局类型 ====================

export type LayoutType =
  | 'hierarchical'     // 层次布局（流程图）
  | 'layered'          // 分层布局（架构图）
  | 'sequence'         // 时序布局
  | 'swimlane'         // 泳道布局
  | 'tree'             // 树形布局
  | 'force'            // 力导向布局
  | 'circular'         // 环形布局
  | 'timeline';        // 时间线布局

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

// ==================== 元素类型 ====================

export type ElementType =
  | 'node'             // 基础节点
  | 'container'        // 容器（可包含子元素）
  | 'layer'            // 层（分层架构图）
  | 'lane'             // 泳道
  | 'group'            // 分组
  | 'actor'            // 参与者（时序图）
  | 'entity';          // 实体（ER图）

export type ShapeType =
  | 'rect'             // 矩形
  | 'roundrect'        // 圆角矩形
  | 'circle'           // 圆形
  | 'ellipse'          // 椭圆
  | 'diamond'          // 菱形
  | 'parallelogram'    // 平行四边形
  | 'hexagon'          // 六边形
  | 'cylinder'         // 圆柱体（数据库）
  | 'actor'            // 人形（参与者）
  | 'note'             // 便签
  | 'cloud'            // 云形
  | 'custom';          // 自定义

// ==================== 关系类型 ====================

export type RelationshipType =
  | 'edge'             // 基础连线
  | 'arrow'            // 箭头
  | 'line'             // 直线
  | 'dashed'           // 虚线
  | 'dotted'           // 点线
  | 'association'      // 关联
  | 'inheritance'      // 继承
  | 'composition'      // 组合
  | 'aggregation'      // 聚合
  | 'dependency'       // 依赖
  | 'message';         // 消息（时序图）

export type ArrowType = 'none' | 'arrow' | 'diamond' | 'circle' | 'cross';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

// ==================== 样式定义 ====================

export interface ElementStyle {
  // 填充
  fillColor?: string;
  filled?: boolean;
  
  // 边框
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: LineStyle;
  
  // 文本
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // 形状
  radius?: number;
  
  // 其他
  opacity?: number;
  shadow?: boolean;
}

export interface RelationshipStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: LineStyle;
  
  // 箭头
  sourceArrow?: ArrowType;
  targetArrow?: ArrowType;
  
  // 文本
  labelColor?: string;
  labelBackground?: string;
  fontSize?: number;
  
  // 其他
  curved?: boolean;
  curveOffset?: number;
}

// ==================== 位置和尺寸 ====================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Position, Size {}

// ==================== 核心数据结构 ====================

/**
 * 图表元素
 */
export interface DiagramElement {
  id: string;
  type: ElementType;
  shape: ShapeType;
  label: string;
  
  // 层级关系
  parent?: string;         // 父元素ID
  children?: string[];     // 子元素ID列表
  
  // 位置（布局计算后填充）
  position?: Position;
  size?: Size;
  
  // 样式
  style?: ElementStyle;
  
  // 自定义数据
  data?: Record<string, any>;
}

/**
 * 图表关系（连线）
 */
export interface DiagramRelationship {
  id: string;
  type: RelationshipType;
  
  // 连接
  source: string;          // 源元素ID
  target: string;          // 目标元素ID
  
  // 标签
  label?: string;
  
  // 样式
  style?: RelationshipStyle;
  
  // 路径点（布局计算后填充）
  points?: Position[];
  
  // 自定义数据
  data?: Record<string, any>;
}

/**
 * 图表配置
 */
export interface DiagramConfig {
  // 布局配置
  layout: LayoutType;
  direction?: LayoutDirection;
  
  // 间距配置
  nodeSpacing?: number;
  rankSpacing?: number;
  
  // 自定义配置
  [key: string]: any;
}

/**
 * 完整的图表模型
 */
export interface DiagramModel {
  // 基本信息
  id: string;
  name: string;
  type: DiagramType;
  
  // 配置
  config: DiagramConfig;
  
  // 元素和关系
  elements: DiagramElement[];
  relationships: DiagramRelationship[];
  
  // 元数据
  metadata?: {
    created?: string;
    modified?: string;
    author?: string;
    version?: string;
    [key: string]: any;
  };
}

// ==================== 布局结果 ====================

/**
 * 布局后的元素（包含计算好的位置）
 */
export interface LayoutedElement extends DiagramElement {
  position: Position;
  size: Size;
}

/**
 * 布局后的关系（包含计算好的路径）
 */
export interface LayoutedRelationship extends DiagramRelationship {
  points: Position[];
}

/**
 * 布局结果
 */
export interface LayoutResult {
  elements: LayoutedElement[];
  relationships: LayoutedRelationship[];
  bounds: Bounds;
}

// ==================== 渲染目标 ====================

export type RenderTarget = 'svg' | 'canvas' | 'edgeless';

/**
 * 渲染配置
 */
export interface RenderConfig {
  target: RenderTarget;
  width?: number;
  height?: number;
  padding?: number;
  scale?: number;
  theme?: string;
}

/**
 * 渲染结果
 */
export interface RenderResult {
  target: RenderTarget;
  content: string | HTMLElement;
  bounds: Bounds;
}

// ==================== 主题系统 ====================

export interface Theme {
  name: string;
  
  // 默认样式
  node: ElementStyle;
  relationship: RelationshipStyle;
  
  // 特定类型的样式
  nodeTypes?: Record<ElementType, Partial<ElementStyle>>;
  shapeTypes?: Record<ShapeType, Partial<ElementStyle>>;
  
  // 颜色方案
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    border?: string;
    [key: string]: string | undefined;
  };
}

