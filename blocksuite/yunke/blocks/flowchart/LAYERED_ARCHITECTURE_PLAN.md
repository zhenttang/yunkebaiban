# 🏗️ 分层架构图实现方案

## 📋 需求分析

用户想要实现类似截图中的**分层架构图**，特点如下：

### 视觉特征
- ✅ 横向分层布局（6个层级）
- ✅ 每层有不同的背景色
- ✅ 层内组件横向排列
- ✅ 无连线或简单的层间连线
- ✅ 整齐对齐，美观专业

### 与当前流程图的区别

| 特性 | 当前流程图 | 分层架构图 |
|------|-----------|-----------|
| 布局方式 | 基于连线的拓扑排序 | 固定分层 |
| 节点排列 | 纵向流动 | 横向排列 |
| 连线 | 强调流程关系 | 弱化或无连线 |
| 分组 | 围绕节点的边框 | 横跨整行的背景层 |
| 用途 | 流程图、时序图 | 技术架构、系统分层 |

## 🎯 实现方案

### 方案 1: 扩展 DSL 语法（推荐）

添加 `layer` 关键字，专门用于分层架构图：

```typescript
diagram "技术架构" layout "layered" {
  layer presentation label "表现层" color "#c8e6c9" {
    node kotlin label "Kotlin"
    node swift label "Swift"
    node hybird label "Hybird"
    node vue label "Vue"
    node miniprogram label "MiniProgram"
  }
  
  layer dataexchange label "数据交换层" color "#b3c5d7" {
    node http label "HTTP(s)"
    node json label "JSON"
  }
  
  layer servicesupport label "服务支撑层" color "#bbdefb" {
    node nginx label "Nginx"
    node nacos label "Nacos"
    node fegin label "Fegin"
    node sentinel label "Sentinel"
    node jjwt label "JJWT"
  }
  
  layer serviceimpl label "服务实现层" color "#ffe0b2" {
    node spring label "Spring"
    node springcloud label "Spring Cloud"
    node springboot label "Spring Boot"
    node springmvc label "Spring MVC"
    node springcloudalibaba label "Spring Cloud Alibaba"
    
    node mybatis label "MyBatis Plus"
    node durid label "Durid"
    node rabbitmq label "RabbitMQ"
    node xxljob label "XXL-Job"
    node caffeine label "Caffeine"
    
    node skywalking label "Skywalking"
    node seata label "seata"
    node swagger label "Swagger"
    node junit label "Junit"
    node logback label "Logback"
  }
  
  layer storage label "存储层" color "#b3e5fc" {
    node mysql label "MySQL"
    node redis label "Redis"
    node mongodb label "MongoDB"
    node efk label "EFK"
    node oss label "OSS"
  }
  
  layer infrastructure label "基础设施层" color "#e0e0e0" {
    node linux label "Linux"
    node tomcat label "Tomcat"
    node jenkins label "Jenkins"
    node maven label "Maven"
    node bitbucket label "BitBucket"
  }
}
```

### 方案 2: 使用现有 group 语法（快速方案）

如果不想大改，可以用 `group` 模拟，但需要：
1. 添加 group 的背景色支持
2. 修改布局算法，让 group 横向铺开
3. 节点在 group 内横向排列

```typescript
diagram "技术架构" {
  group presentation label "表现层" {
    node kotlin label "Kotlin"
    node swift label "Swift"
    // ...
  }
  
  group dataexchange label "数据交换层" {
    node http label "HTTP(s)"
    node json label "JSON"
  }
  
  // ...
}
```

## 🔧 技术实现

### 1. 扩展 DSL 解析器

**文件**: `src/dsl-parser.ts`

```typescript
export interface ParsedLayer {
  id: string;
  label: string;
  color?: string;
  nodeIds: string[];
}

export interface ParsedDiagram {
  name: string;
  layout: 'flowchart' | 'layered';  // 新增：布局类型
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  groups: Map<string, { label: string; nodeIds: string[] }>;
  layers: ParsedLayer[];  // 新增：层级定义
}

// 解析 layer 语法
const layerMatch = line.match(/^layer\s+(\w+)\s+label\s+"([^"]+)"(?:\s+color\s+"([^"]+)")?\s*\{/);
if (layerMatch) {
  const layerId = layerMatch[1];
  const layerLabel = layerMatch[2];
  const layerColor = layerMatch[3];
  currentLayer = layerId;
  layers.push({
    id: layerId,
    label: layerLabel,
    color: layerColor,
    nodeIds: []
  });
  braceLevel++;
  continue;
}
```

### 2. 创建分层布局引擎

**新文件**: `src/layered-layout-engine.ts`

```typescript
export interface LayeredLayoutConfig {
  layerHeight: number;      // 每层高度
  layerPadding: number;     // 层内边距
  nodeWidth: number;        // 节点宽度
  nodeHeight: number;       // 节点高度
  nodeGap: number;          // 节点间距
  layerGap: number;         // 层间距
}

export function calculateLayeredLayout(
  diagram: ParsedDiagram,
  config: LayeredLayoutConfig = DEFAULT_CONFIG
): LayoutedDiagram {
  const layoutedNodes: LayoutedNode[] = [];
  const layoutedLayers: LayoutedLayer[] = [];
  
  let currentY = 0;
  
  diagram.layers.forEach((layer, index) => {
    // 获取该层的所有节点
    const layerNodes = diagram.nodes.filter(n => 
      layer.nodeIds.includes(n.id.split('.').pop() || n.id)
    );
    
    // 计算节点总宽度
    const totalNodesWidth = layerNodes.length * config.nodeWidth + 
                           (layerNodes.length - 1) * config.nodeGap;
    
    // 起始 X 坐标（居中）
    const startX = (CANVAS_WIDTH - totalNodesWidth) / 2;
    
    // 布局层内节点
    layerNodes.forEach((node, i) => {
      const x = startX + i * (config.nodeWidth + config.nodeGap);
      const y = currentY + config.layerPadding + 
                (config.layerHeight - config.nodeHeight) / 2;
      
      layoutedNodes.push({
        id: node.id,
        label: node.label,
        x,
        y,
        width: config.nodeWidth,
        height: config.nodeHeight,
        layer: layer.id,
      });
    });
    
    // 记录层的位置和尺寸
    layoutedLayers.push({
      id: layer.id,
      label: layer.label,
      color: layer.color,
      x: 0,
      y: currentY,
      width: CANVAS_WIDTH,
      height: config.layerHeight,
    });
    
    // 更新下一层的Y坐标
    currentY += config.layerHeight + config.layerGap;
  });
  
  return {
    nodes: layoutedNodes,
    edges: diagram.edges.map(/* ... */),
    layers: layoutedLayers,
  };
}
```

### 3. 扩展 SVG 渲染器

**文件**: `src/svg-renderer.ts`

```typescript
function generateLayeredSVG(diagram: ParsedDiagram, layout: LayoutedDiagram) {
  let svg = `<svg ...>`;
  
  // 绘制层背景
  layout.layers.forEach(layer => {
    svg += `<rect class="layer-background" 
      x="${layer.x}" 
      y="${layer.y}" 
      width="${layer.width}" 
      height="${layer.height}" 
      fill="${layer.color || '#f5f5f5'}" 
      rx="8" />`;
    
    // 绘制层标题
    svg += `<text class="layer-title" 
      x="${layer.x + 100}" 
      y="${layer.y + 30}" 
      fill="#555">${layer.label}</text>`;
  });
  
  // 绘制节点
  layout.nodes.forEach(node => {
    svg += `<rect class="node-rect" ...>`;
    svg += `<text class="node-text" ...>${node.label}</text>`;
  });
  
  svg += '</svg>';
  return svg;
}
```

### 4. 扩展元素生成器

**文件**: `src/element-generator.ts`

```typescript
private createLayerBackground(
  layer: LayoutedLayer,
  offsetX: number,
  offsetY: number
): string {
  return this.surface.addElement({
    type: 'shape',
    xywh: `[${layer.x + offsetX}, ${layer.y + offsetY}, ${layer.width}, ${layer.height}]`,
    shapeType: 'rect',
    radius: 8,
    filled: true,
    fillColor: layer.color || '#f5f5f5',
    strokeWidth: 0,
    // 添加层标题作为文本
    text: new Y.Text(layer.label),
    textHorizontalAlign: 'left',
    textVerticalAlign: 'top',
    fontSize: 18,
    fontWeight: '600',
    color: '#555555',
  });
}
```

## 📝 DSL 示例

### 完整示例：技术架构图

```
diagram "技术架构" layout "layered" {
  layer presentation label "表现层" color "#c8e6c9" {
    node kotlin label "Kotlin"
    node swift label "Swift"
    node hybird label "Hybird"
    node vue label "Vue"
    node miniprogram label "MiniProgram"
  }
  
  layer dataexchange label "数据交换层" color "#b3c5d7" {
    node http label "HTTP(s)"
    node json label "JSON"
  }
  
  layer servicesupport label "服务支撑层" color "#bbdefb" {
    node nginx label "Nginx"
    node nacos label "Nacos"
    node fegin label "Fegin"
    node sentinel label "Sentinel"
    node jjwt label "JJWT"
  }
  
  layer serviceimpl label "服务实现层" color "#ffe0b2" {
    node spring label "Spring"
    node springcloud label "Spring Cloud"
    node springboot label "Spring Boot"
    node springmvc label "Spring MVC"
    node springcloudalibaba label "Spring Cloud Alibaba"
    node mybatis label "MyBatis Plus"
    node durid label "Durid"
    node rabbitmq label "RabbitMQ"
    node xxljob label "XXL-Job"
    node caffeine label "Caffeine"
    node skywalking label "Skywalking"
    node seata label "seata"
    node swagger label "Swagger"
    node junit label "Junit"
    node logback label "Logback"
  }
  
  layer storage label "存储层" color "#b3e5fc" {
    node mysql label "MySQL"
    node redis label "Redis"
    node mongodb label "MongoDB"
    node efk label "EFK"
    node oss label "OSS"
  }
  
  layer infrastructure label "基础设施层" color "#e0e0e0" {
    node linux label "Linux"
    node tomcat label "Tomcat"
    node jenkins label "Jenkins"
    node maven label "Maven"
    node bitbucket label "BitBucket"
  }
}
```

## 🎨 视觉效果

### 布局参数

```typescript
const LAYERED_LAYOUT_CONFIG = {
  layerHeight: 140,       // 每层高度
  layerPadding: 20,       // 层内上下边距
  nodeWidth: 140,         // 节点宽度
  nodeHeight: 60,         // 节点高度
  nodeGap: 20,            // 节点间距
  layerGap: 2,            // 层间距（很小，紧密排列）
};
```

### 颜色方案

```typescript
const LAYER_COLORS = {
  presentation: '#c8e6c9',      // 浅绿色
  dataexchange: '#b3c5d7',      // 浅蓝灰
  servicesupport: '#bbdefb',    // 浅蓝色
  serviceimpl: '#ffe0b2',       // 浅橙色
  storage: '#b3e5fc',           // 浅天蓝
  infrastructure: '#e0e0e0',    // 浅灰色
};
```

## 📦 实现步骤

### Phase 1: 基础支持（1-2小时）
1. ✅ 扩展 ParsedDiagram 接口，添加 layers 字段
2. ✅ 扩展 dsl-parser.ts，添加 layer 语法解析
3. ✅ 创建 layered-layout-engine.ts
4. ✅ 修改 svg-renderer.ts，添加 layer 渲染逻辑

### Phase 2: 白板集成（1小时）
1. ✅ 扩展 element-generator.ts，支持创建层背景
2. ✅ 测试生成到白板

### Phase 3: 优化（30分钟）
1. ✅ 自动换行（当节点过多时）
2. ✅ 响应式布局
3. ✅ 层标题样式优化

## ✨ 优势

1. **专业美观**: 和主流架构图风格一致
2. **易于编写**: DSL 语法清晰简洁
3. **可编辑**: 生成的仍是真实白板元素
4. **双模式**: 既支持流程图，又支持架构图

## 🚀 未来扩展

1. **多列布局**: 层内节点自动分多行
2. **更多层样式**: 渐变、图案等
3. **导出为图片**: 高清导出架构图
4. **模板库**: 预设常见架构模板

---

**是否开始实现？** 我可以立即开始编码，预计 1-2 小时完成基础功能！

