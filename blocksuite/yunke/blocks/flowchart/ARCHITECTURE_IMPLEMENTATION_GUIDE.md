# 🏗️ 通用图表系统 - 架构实现指南

## 📦 架构概览

我已经为你构建了一个**完整的、可扩展的通用图表系统**！

### 核心模块

```
src/core/
├── diagram-types.ts      ✅ 核心类型定义
├── base-parser.ts        ✅ 解析器基类 + 注册表
├── base-layout.ts        ✅ 布局引擎基类 + 注册表
├── base-renderer.ts      ✅ 渲染器基类 + 注册表
└── diagram-engine.ts     ✅ 核心调度器 + 统一API
```

### 设计模式

#### 1. **策略模式** - 可插拔的解析器/布局/渲染器
```
DiagramEngine
    ↓
ParserRegistry → 选择合适的解析器
    ↓
LayoutRegistry → 选择合适的布局引擎
    ↓
RendererRegistry → 选择合适的渲染器
```

#### 2. **工厂模式** - 注册表管理
```typescript
// 注册
ParserRegistry.register(new LayeredParser());
LayoutRegistry.register(new LayeredLayout());
RendererRegistry.register(new SVGRenderer());

// 自动选择和使用
const result = DiagramEngine.generate(dslCode);
```

#### 3. **模板方法模式** - 基类定义流程，子类实现细节
```typescript
abstract class BaseParser {
  // 模板方法
  parse(code) {
    // 统一的前置处理
    // 调用抽象方法
    // 统一的后置处理
  }
}
```

## 🎯 使用方式

### 最简单的使用

```typescript
import { DiagramEngine } from './core/diagram-engine.js';

// 一行代码生成图表
const result = await DiagramEngine.generate(`
  diagram "技术架构" type "layered" {
    layer frontend label "前端" color "#c8e6c9" {
      node react label "React"
      node vue label "Vue"
    }
    
    layer backend label "后端" color "#ffe0b2" {
      node spring label "Spring"
      node node label "Node.js"
    }
  }
`);

// result.model - 解析后的数据模型
// result.layout - 布局计算结果
// result.render - 渲染结果（SVG字符串）
```

### 分步骤使用

```typescript
// 步骤1: 解析
const model = DiagramEngine.parse(dslCode);

// 步骤2: 布局
const layout = LayoutRegistry.layoutAuto(model, {
  nodeWidth: 200,
  nodeSpacing: 100
});

// 步骤3: 渲染
const svg = RendererRegistry.render(layout, 'svg');
const edgeless = RendererRegistry.render(layout, 'edgeless');
```

### 验证 DSL

```typescript
const validation = DiagramEngine.validate(dslCode);

if (!validation.valid) {
  validation.errors.forEach(err => {
    console.error(`Line ${err.line}: ${err.message}`);
  });
}
```

## 🔌 如何扩展

### 添加新的图表类型（3个步骤）

#### 步骤1: 创建解析器

```typescript
// src/parsers/layered-parser.ts
import { BaseParser } from '../core/base-parser.js';

export class LayeredParser extends BaseParser {
  readonly supportedType = 'layered';
  
  parse(dslCode: string): DiagramModel {
    // 解析 DSL，返回 DiagramModel
    const model: DiagramModel = {
      id: this.generateId('diagram'),
      name: '...',
      type: 'layered',
      config: { layout: 'layered' },
      elements: [],
      relationships: []
    };
    
    // 解析逻辑...
    
    return model;
  }
}
```

#### 步骤2: 创建布局引擎

```typescript
// src/layouts/layered-layout.ts
import { BaseLayoutEngine } from '../core/base-layout.js';

export class LayeredLayoutEngine extends BaseLayoutEngine {
  readonly supportedType = 'layered';
  
  layout(model: DiagramModel, config?: LayoutConfig): LayoutResult {
    const mergedConfig = this.mergeConfig(config);
    const elements: LayoutedElement[] = [];
    
    // 布局计算逻辑...
    // 计算每个元素的 position 和 size
    
    return {
      elements,
      relationships: [],
      bounds: this.calculateBounds(elements)
    };
  }
}
```

#### 步骤3: 注册

```typescript
// src/index.ts
import { ParserRegistry, LayoutRegistry } from './core/diagram-engine.js';
import { LayeredParser } from './parsers/layered-parser.js';
import { LayeredLayoutEngine } from './layouts/layered-layout.js';

// 注册
ParserRegistry.register(new LayeredParser());
LayoutRegistry.register(new LayeredLayoutEngine());

// 就这么简单！现在可以使用了
const result = await DiagramEngine.generate(dslCode);
```

## 📋 待实现的图表类型

### 优先级 P0（最需要）

#### 1. 分层架构图 (Layered)
```
文件:
- src/parsers/layered-parser.ts
- src/layouts/layered-layout.ts

特点:
- 横向分层
- 彩色背景
- 层内横向排列

预计: 2-3小时
```

#### 2. 优化流程图 (Flowchart)
```
文件:
- src/parsers/flowchart-parser.ts (重构现有)
- src/layouts/hierarchical-layout.ts (重构现有)

改进:
- 使用新架构
- 支持更多形状
- 更好的布局

预计: 2-3小时
```

### 优先级 P1（常用）

#### 3. 时序图 (Sequence)
```
文件:
- src/parsers/sequence-parser.ts
- src/layouts/sequence-layout.ts

特点:
- 垂直时间轴
- 对象生命线
- 消息传递

预计: 3-4小时
```

#### 4. 组织结构图 (Tree)
```
文件:
- src/parsers/tree-parser.ts
- src/layouts/tree-layout.ts

特点:
- 树形层级
- 上下级关系

预计: 2-3小时
```

### 优先级 P2（进阶）

#### 5. 泳道图 (Swimlane)
```
特点:
- 横向/纵向泳道
- 跨泳道流程

预计: 3-4小时
```

#### 6. ER图 (Entity-Relationship)
```
特点:
- 实体、属性
- 关系基数

预计: 4-5小时
```

#### 7. 甘特图 (Gantt)
```
特点:
- 时间轴
- 任务条形图
- 依赖关系

预计: 4-5小时
```

## 🎨 渲染器实现

### SVG 渲染器（已计划）

```typescript
// src/renderers/svg-renderer.ts
import { BaseRenderer } from '../core/base-renderer.js';

export class SVGRenderer extends BaseRenderer {
  readonly supportedTarget = 'svg';
  
  render(layout: LayoutResult, config?: RenderConfig): RenderResult {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
                    width="${layout.bounds.width}" 
                    height="${layout.bounds.height}">`;
    
    // 渲染元素
    layout.elements.forEach(elem => {
      svg += this.renderElement(elem);
    });
    
    // 渲染关系
    layout.relationships.forEach(rel => {
      svg += this.renderRelationship(rel);
    });
    
    svg += '</svg>';
    
    return {
      target: 'svg',
      content: svg,
      bounds: layout.bounds
    };
  }
  
  private renderElement(elem: LayoutedElement): string {
    const style = this.applyTheme('node', elem.style);
    // 根据 shape 类型渲染不同的形状
    return `<rect .../>`;
  }
}
```

### 白板渲染器（集成现有代码）

```typescript
// src/renderers/edgeless-renderer.ts
export class EdgelessRenderer extends BaseRenderer {
  readonly supportedTarget = 'edgeless';
  
  constructor(
    private surface: SurfaceBlockModel,
    theme?: Theme
  ) {
    super(theme);
  }
  
  render(layout: LayoutResult): RenderResult {
    const elementIds: string[] = [];
    
    // 创建白板元素
    layout.elements.forEach(elem => {
      const id = this.surface.addElement({
        type: 'shape',
        xywh: `[${elem.position.x}, ${elem.position.y}, ${elem.size.width}, ${elem.size.height}]`,
        // ... 其他属性
      });
      elementIds.push(id);
    });
    
    // 创建连线
    layout.relationships.forEach(rel => {
      // ...
    });
    
    return {
      target: 'edgeless',
      content: document.createElement('div'), // 占位
      bounds: layout.bounds
    };
  }
}
```

## 🎨 主题系统

### 预设主题

```typescript
// src/themes/default-theme.ts
export const DefaultTheme: Theme = {
  name: 'default',
  node: {
    fillColor: '#1e96ed',
    strokeColor: '#1565c0',
    textColor: '#ffffff'
  },
  relationship: {
    stroke: '#666666',
    strokeWidth: 2
  }
};

// src/themes/dark-theme.ts
export const DarkTheme: Theme = {
  name: 'dark',
  node: {
    fillColor: '#424242',
    strokeColor: '#616161',
    textColor: '#ffffff'
  },
  relationship: {
    stroke: '#90a4ae'
  }
};
```

### 使用主题

```typescript
import { SVGRenderer } from './renderers/svg-renderer.js';
import { DarkTheme } from './themes/dark-theme.js';

const renderer = new SVGRenderer(DarkTheme);
RendererRegistry.register(renderer);
```

## 📊 完整示例

### 示例1: 分层架构图

```typescript
const layeredDSL = `
diagram "云知白板技术栈" type "layered" {
  layer presentation label "表现层" color "#c8e6c9" {
    node kotlin label "Kotlin"
    node swift label "Swift"
    node react label "React"
    node vue label "Vue"
  }
  
  layer service label "服务层" color "#ffe0b2" {
    node spring label "Spring Boot"
    node node label "Node.js"
  }
  
  layer storage label "存储层" color "#b3e5fc" {
    node mysql label "MySQL"
    node redis label "Redis"
  }
}
`;

const result = await DiagramEngine.generate(layeredDSL);
document.body.innerHTML = result.render.content;
```

### 示例2: 流程图

```typescript
const flowchartDSL = `
diagram "用户登录" type "flowchart" {
  node start shape "circle" label "开始"
  node input shape "rect" label "输入账号密码"
  node verify shape "diamond" label "验证"
  node success shape "rect" label "登录成功"
  node fail shape "rect" label "登录失败"
  node end shape "circle" label "结束"
  
  start -> input
  input -> verify
  verify -> success : "通过"
  verify -> fail : "失败"
  success -> end
  fail -> end
}
`;
```

### 示例3: 时序图

```typescript
const sequenceDSL = `
diagram "支付流程" type "sequence" {
  actor user label "用户"
  actor frontend label "前端"
  actor backend label "后端"
  actor payment label "支付网关"
  
  user -> frontend : "点击支付"
  frontend -> backend : "POST /order/pay"
  backend -> payment : "创建支付订单"
  payment -> backend : "返回支付URL"
  backend -> frontend : "返回支付链接"
  frontend -> user : "跳转支付页面"
}
`;
```

## 📈 实现进度计划

### 第1天（核心 + 分层图）
- [x] ✅ 核心架构（2小时）
  - [x] diagram-types.ts
  - [x] base-parser.ts
  - [x] base-layout.ts
  - [x] base-renderer.ts
  - [x] diagram-engine.ts

- [ ] 🔨 分层架构图实现（3小时）
  - [ ] LayeredParser
  - [ ] LayeredLayout
  - [ ] 测试和示例

### 第2天（流程图重构 + SVG渲染）
- [ ] 🔨 流程图重构（3小时）
  - [ ] FlowchartParser
  - [ ] HierarchicalLayout
  - [ ] 更多形状支持

- [ ] 🔨 SVG渲染器（2小时）
  - [ ] SVGRenderer
  - [ ] 形状渲染库

### 第3天（白板集成 + 时序图）
- [ ] 🔨 白板渲染器（3小时）
  - [ ] EdgelessRenderer
  - [ ] 集成element-generator

- [ ] 🔨 时序图（3小时）
  - [ ] SequenceParser
  - [ ] SequenceLayout

### 第4-5天（其他图表类型）
- [ ] 🔨 组织结构图
- [ ] 🔨 泳道图
- [ ] 🔨 ER图

### 第6-7天（优化和文档）
- [ ] 🔨 主题系统完善
- [ ] 🔨 更多示例
- [ ] 🔨 完整文档
- [ ] 🔨 单元测试

## ✨ 优势总结

### 1. 架构优势
- ✅ **高度可扩展**: 添加新图表类型只需3个文件
- ✅ **解耦设计**: 解析、布局、渲染完全分离
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **统一接口**: 所有图表类型使用相同的 API

### 2. 开发优势
- ✅ **易于维护**: 模块化设计，职责清晰
- ✅ **易于测试**: 每个模块可独立测试
- ✅ **易于扩展**: 注册表模式，动态扩展
- ✅ **易于理解**: 清晰的继承关系

### 3. 使用优势
- ✅ **简单易用**: 一行代码生成图表
- ✅ **功能强大**: 支持多种图表类型
- ✅ **灵活配置**: 可定制布局和样式
- ✅ **多端输出**: SVG、Canvas、白板元素

---

## 🚀 下一步

我现在就开始实现：

1. **分层架构图解析器和布局引擎**（你最需要的）
2. **SVG 渲染器**（用于预览）
3. **白板渲染器**（集成到白板）
4. **完整的示例**

预计 **2-3 小时**完成分层架构图的完整实现！

要我开始吗？🚀

