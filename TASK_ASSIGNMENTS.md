# 性能优化项目 - 任务分配清单

**项目**: 大型文档性能优化
**项目经理**: Claude
**创建日期**: 2025-11-15

---

## 🎯 Phase 1 任务分配（Week 1-2）

### 任务概览

| 任务ID | 任务名称 | 负责人 | 分支 | 优先级 | 状态 | 截止日期 |
|--------|---------|--------|------|--------|------|---------|
| T1.1 | 缓存优化 | Developer A | perf/phase1-cache-optimization | P0 | 🟡 待开始 | Week 1 |
| T1.2 | shouldUpdate优化 | Developer B | perf/phase1-shouldupdate-optimization | P0 | 🟡 待开始 | Week 1 |
| T1.3 | 性能监控系统 | Developer C | perf/phase1-performance-monitoring | P1 | 🟡 待开始 | Week 2 |

---

## 📋 任务T1.1: 缓存优化

**负责人**: Developer A (或AI Agent A)
**分支**: `perf/phase1-cache-optimization`
**工作量**: 2天
**优先级**: P0 🔴

### 技术背景
当前每次调用`EditorHost._renderModel()`都会重新创建widgets对象，导致：
- Lit认为props变化（引用不同）
- 触发子组件不必要的更新
- 每次渲染创建37+个widgets对象

### 解决方案
使用WeakMap缓存widgets对象，只有在widgetViews真正变化时才重新创建。

### 详细步骤

#### Step 1: 添加缓存存储（30分钟）

**文件**: `blocksuite/framework/std/src/view/element/lit-host.ts`

```typescript
export class EditorHost extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  // ... 现有代码

  // 🟢 添加：widgets缓存
  private _widgetsCache = new WeakMap<string, Record<string, TemplateResult>>();
}
```

#### Step 2: 实现缓存获取方法（1小时）

在`EditorHost`类中添加：

```typescript
private _getWidgets(flavour: string): Record<string, TemplateResult> {
  // 检查缓存
  if (this._widgetsCache.has(flavour)) {
    return this._widgetsCache.get(flavour)!;
  }

  // 缓存未命中，计算widgets
  const widgetViews = this.std.provider.getAll(WidgetViewIdentifier);
  const widgets = Array.from(widgetViews.entries()).reduce(
    (mapping, [key, tag]) => {
      const [widgetFlavour, id] = key.split('|');
      if (widgetFlavour === flavour) {
        const template = html`<${tag} ${unsafeStatic(WIDGET_ID_ATTR)}=${id}></${tag}>`;
        mapping[id] = template;
      }
      return mapping;
    },
    {} as Record<string, TemplateResult>
  );

  // 存入缓存
  this._widgetsCache.set(flavour, widgets);
  return widgets;
}
```

#### Step 3: 修改_renderModel使用缓存（30分钟）

修改`_renderModel`方法：

```typescript
private readonly _renderModel = (model: BlockModel): TemplateResult => {
  const { flavour } = model;
  const block = this.store.getBlock(model.id);

  if (!block || block.blockViewType === 'hidden') {
    return html`${nothing}`;
  }

  const schema = this.store.schema.flavourSchemaMap.get(flavour);
  const view = this.std.getView(flavour);

  if (!schema || !view) {
    console.warn(`Cannot find render flavour ${flavour}.`);
    return html`${nothing}`;
  }

  // 🟢 修改：使用缓存的widgets
  const widgets = this._getWidgets(flavour);

  const tag = typeof view === 'function' ? view(model) : view;
  return html`<${tag}
    ${unsafeStatic(BLOCK_ID_ATTR)}=${model.id}
    .widgets=${widgets}
    .viewType=${block.blockViewType}
  ></${tag}>`;
};
```

#### Step 4: 添加缓存失效逻辑（1小时）

添加清理方法：

```typescript
// 在provider变化时清理缓存
override connectedCallback() {
  super.connectedCallback();

  // ... 现有代码

  // 🟢 添加：监听provider变化
  this.disposables.add(
    this.std.provider.onChanged(() => {
      // 清空缓存，下次渲染时重新计算
      this._widgetsCache = new WeakMap();
    })
  );
}
```

#### Step 5: 添加单元测试（2小时）

**新建文件**: `blocksuite/framework/std/src/view/element/__tests__/widgets-cache.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { EditorHost } from '../lit-host.js';

describe('EditorHost widgets cache', () => {
  it('should cache widgets for the same flavour', () => {
    // 测试缓存命中
  });

  it('should return same object reference when cache hits', () => {
    // 测试引用相等
  });

  it('should clear cache when provider changes', () => {
    // 测试缓存失效
  });
});
```

#### Step 6: 性能测试（1小时）

创建性能对比测试：

```typescript
// 测试脚本
const testWidgetsCreation = () => {
  let creationCount = 0;

  // Hook Array.from to count
  const originalArrayFrom = Array.from;
  Array.from = function(...args) {
    creationCount++;
    return originalArrayFrom.apply(this, args);
  };

  // 模拟100次渲染
  for (let i = 0; i < 100; i++) {
    host._renderModel(model);
  }

  console.log(`Widgets created: ${creationCount} times`);
  // 期望：优化前100次，优化后1次
};
```

### 验收清单
- [ ] `_widgetsCache`字段已添加
- [ ] `_getWidgets()`方法实现正确
- [ ] `_renderModel()`已使用缓存
- [ ] 缓存失效逻辑正确
- [ ] 单元测试覆盖率>80%
- [ ] 性能测试通过（对象创建减少90%）
- [ ] 手动测试无回归
- [ ] Code Review通过

### 提交PR时需包含
1. 代码修改
2. 单元测试
3. 性能对比报告（Before/After数据）
4. 自测截图/视频

---

## 📋 任务T1.2: shouldUpdate优化

**负责人**: Developer B (或AI Agent B)
**分支**: `perf/phase1-shouldupdate-optimization`
**工作量**: 2天
**优先级**: P0 🔴

### 技术背景
当前`BlockComponent`没有实现`shouldUpdate`，Lit的默认行为是只要props引用变化就更新。

问题：即使widgets内容相同，但因为是新对象（引用不同），Lit也会触发更新。

### 解决方案
实现`shouldUpdate`方法，深度对比widgets内容，只有真正变化才更新。

### 详细步骤

#### Step 1: 实现shouldUpdate（1.5小时）

**文件**: `blocksuite/framework/std/src/view/element/block-component.ts`

```typescript
export class BlockComponent<...> extends ... {
  // ... 现有代码

  // 🟢 添加：shouldUpdate方法
  override shouldUpdate(changedProperties: PropertyValues): boolean {
    // 如果widgets属性变化，需要深度对比
    if (changedProperties.has('widgets')) {
      const oldWidgets = changedProperties.get('widgets') as Record<string, TemplateResult>;
      const newWidgets = this.widgets;

      // 深度对比widgets
      if (this._widgetsEqual(oldWidgets, newWidgets)) {
        // widgets内容相同，跳过更新
        changedProperties.delete('widgets');

        // 如果没有其他属性变化，返回false
        if (changedProperties.size === 0) {
          return false;
        }
      }
    }

    // 其他属性使用默认逻辑
    return true;
  }

  // 🟢 添加：widgets深度对比方法
  private _widgetsEqual(
    a: Record<string, TemplateResult> | undefined,
    b: Record<string, TemplateResult> | undefined
  ): boolean {
    // 两个都不存在，相等
    if (!a && !b) return true;

    // 一个存在一个不存在，不相等
    if (!a || !b) return false;

    // 比较key数量
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    // 比较每个key的TemplateResult
    return keysA.every(key => {
      if (!(key in b)) return false;

      // 比较TemplateResult的strings（模板字符串部分）
      // 这是Lit内部用于判断模板是否相同的方法
      return a[key].strings === b[key].strings;
    });
  }
}
```

#### Step 2: 添加性能日志（可选）（30分钟）

```typescript
override shouldUpdate(changedProperties: PropertyValues): boolean {
  if (import.meta.env.DEV) {
    // 开发模式下记录跳过的更新
    if (changedProperties.has('widgets')) {
      const oldWidgets = changedProperties.get('widgets');
      const newWidgets = this.widgets;

      if (this._widgetsEqual(oldWidgets, newWidgets)) {
        console.log(`[Perf] Block ${this.blockId} skipped update (widgets unchanged)`);
      }
    }
  }

  // ... 现有逻辑
}
```

#### Step 3: 单元测试（2小时）

**新建文件**: `blocksuite/framework/std/src/view/element/__tests__/should-update.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BlockComponent } from '../block-component.js';

describe('BlockComponent shouldUpdate', () => {
  it('should skip update when widgets are same', () => {
    // 测试widgets相同时跳过更新
  });

  it('should update when widgets are different', () => {
    // 测试widgets不同时更新
  });

  it('should update when other props change', () => {
    // 测试其他属性变化时更新
  });

  it('_widgetsEqual should compare correctly', () => {
    // 测试_widgetsEqual方法
  });
});
```

#### Step 4: 性能测试（1小时）

创建测试用例，统计更新次数：

```typescript
const testUpdateCount = async () => {
  let updateCount = 0;

  // Hook performUpdate
  const originalUpdate = BlockComponent.prototype.performUpdate;
  BlockComponent.prototype.performUpdate = function() {
    updateCount++;
    originalUpdate.call(this);
  };

  // 模拟100次相同的渲染
  for (let i = 0; i < 100; i++) {
    host.requestUpdate();
    await host.updateComplete;
  }

  console.log(`Updates: ${updateCount}`);
  // 期望：优化前100次，优化后1次
};
```

### 验收清单
- [ ] `shouldUpdate()`方法实现正确
- [ ] `_widgetsEqual()`方法实现正确
- [ ] 单元测试覆盖率>80%
- [ ] 性能测试通过（更新次数减少40-60%）
- [ ] 手动测试无回归
- [ ] Code Review通过

---

## 📋 任务T1.3: 性能监控系统

**负责人**: Developer C (或AI Agent C)
**分支**: `perf/phase1-performance-monitoring`
**工作量**: 2天
**优先级**: P1 🟡

### 技术背景
当前缺少系统的性能监控，无法：
- 准确测量各层调用链路的时间
- 对比优化前后的性能数据
- 发现性能回归

### 解决方案
创建轻量级的性能监控工具，在关键路径添加监控埋点。

### 详细步骤

#### Step 1: 创建PerformanceMonitor类（2小时）

**新建文件**: `blocksuite/framework/std/src/utils/performance-monitor.ts`

```typescript
export interface PerformanceRecord {
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  count: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private records = new Map<string, PerformanceRecord>();
  private enabled = import.meta.env.DEV; // 只在开发模式启用

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(label: string) {
    if (!this.enabled) return;

    const record = this.records.get(label);

    if (record && !record.endTime) {
      // 已经有一个进行中的记录，警告
      console.warn(`[Perf] ${label} already started`);
      return;
    }

    this.records.set(label, {
      label,
      startTime: performance.now(),
      count: (record?.count || 0) + 1,
    });
  }

  end(label: string): number {
    if (!this.enabled) return 0;

    const record = this.records.get(label);

    if (!record) {
      console.warn(`[Perf] No start mark for ${label}`);
      return 0;
    }

    if (record.endTime) {
      console.warn(`[Perf] ${label} already ended`);
      return record.duration || 0;
    }

    const endTime = performance.now();
    const duration = endTime - record.startTime;

    record.endTime = endTime;
    record.duration = duration;

    // 输出到console
    console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);

    return duration;
  }

  getRecord(label: string): PerformanceRecord | undefined {
    return this.records.get(label);
  }

  getAllRecords(): PerformanceRecord[] {
    return Array.from(this.records.values());
  }

  getStats() {
    const records = this.getAllRecords();

    return records.map(record => ({
      label: record.label,
      duration: record.duration?.toFixed(2) || 'N/A',
      count: record.count,
      avgDuration: record.duration ? (record.duration / record.count).toFixed(2) : 'N/A',
    }));
  }

  printStats() {
    console.table(this.getStats());
  }

  clear() {
    this.records.clear();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// 导出单例
export const perfMonitor = PerformanceMonitor.getInstance();
```

#### Step 2: 添加监控埋点（3小时）

**InlineEditor渲染**:

**文件**: `blocksuite/framework/std/src/inline/services/render.ts`

```typescript
import { perfMonitor } from '../../utils/performance-monitor.js';

export class RenderService<TextAttributes extends BaseTextAttributes> {
  render = () => {
    if (!this.editor.rootElement) return;

    // 🟢 监控开始
    perfMonitor.start('inline-editor-render');

    this._rendering = true;

    const rootElement = this.editor.rootElement;
    const embedDeltas = this.editor.deltaService.embedDeltas;
    const chunks = deltaInsertsToChunks(embedDeltas);

    // ... 现有渲染逻辑

    this.editor
      .waitForUpdate()
      .then(() => {
        this._rendering = false;
        this.editor.slots.renderComplete.next();
        this.editor.syncInlineRange();

        // 🟢 监控结束
        perfMonitor.end('inline-editor-render');
      })
      .catch(console.error);
  };
}
```

**BlockComponent渲染**:

**文件**: `blocksuite/framework/std/src/view/element/block-component.ts`

```typescript
import { perfMonitor } from '../../utils/performance-monitor.js';

export class BlockComponent<...> extends ... {
  override updated(changedProperties: PropertyValues) {
    perfMonitor.start(`block-update-${this.flavour}`);

    super.updated(changedProperties);

    perfMonitor.end(`block-update-${this.flavour}`);
  }
}
```

**renderChildren**:

**文件**: `blocksuite/framework/std/src/view/element/lit-host.ts`

```typescript
import { perfMonitor } from '../../utils/performance-monitor.js';

export class EditorHost extends ... {
  renderChildren = (model, filter?) => {
    perfMonitor.start(`render-children-${model.id}`);

    const result = html`${repeat(
      model.children.filter(filter ?? (() => true)),
      child => child.id,
      child => this._renderModel(child)
    )}`;

    perfMonitor.end(`render-children-${model.id}`);

    return result;
  };
}
```

#### Step 3: 创建性能面板（可选）（2小时）

创建一个简单的UI显示性能数据：

```typescript
// 在dev模式下按F12显示性能面板
if (import.meta.env.DEV) {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && e.ctrlKey) {
      perfMonitor.printStats();
    }
  });
}
```

#### Step 4: 添加文档（1小时）

**新建文件**: `docs/performance-monitoring.md`

```markdown
# 性能监控使用指南

## 快速开始

```typescript
import { perfMonitor } from '@blocksuite/std';

// 开始监控
perfMonitor.start('my-operation');

// 执行操作
doSomething();

// 结束监控
perfMonitor.end('my-operation');

// 查看统计
perfMonitor.printStats();
```

## API文档
...
```

### 验收清单
- [ ] `PerformanceMonitor`类实现完整
- [ ] 关键路径已添加监控埋点
- [ ] 性能数据可导出
- [ ] 对原性能影响<1%
- [ ] 文档完善
- [ ] Code Review通过

---

## 📊 进度跟踪

### Week 1 进度

| 日期 | T1.1 | T1.2 | T1.3 | 备注 |
|------|------|------|------|------|
| Mon | - | - | - | Kick-off |
| Tue | 进行中 | 进行中 | - | - |
| Wed | 进行中 | 进行中 | 进行中 | - |
| Thu | 测试 | 测试 | 进行中 | - |
| Fri | PR | PR | 进行中 | - |

### Week 2 进度

| 日期 | T1.1 | T1.2 | T1.3 | 备注 |
|------|------|------|------|------|
| Mon | Review | Review | 测试 | - |
| Tue | 合并 | 合并 | PR | - |
| Wed | - | - | Review | - |
| Thu | - | - | 合并 | - |
| Fri | - | - | - | Phase 1总结 |

---

## 🔄 提交PR检查清单

提交PR时请确保：

- [ ] 代码符合项目规范（ESLint无错误）
- [ ] 单元测试覆盖率>80%
- [ ] 所有测试通过（`yarn test`）
- [ ] 性能测试通过（有Before/After数据）
- [ ] 无明显性能回归
- [ ] 文档已更新
- [ ] PR描述清晰（包含问题、方案、测试结果）
- [ ] 自测截图/视频
- [ ] 关联Issue编号

---

## 📞 联系方式

**遇到问题**?
- 技术问题: 在PR评论区提问
- 进度阻塞: @项目经理
- 紧急问题: Slack #perf-optimization频道

**Code Review**:
- Review SLA: 24小时内
- Reviewer: 至少2人approve

---

**最后更新**: 2025-11-15
**下次更新**: Week 1 Friday
