# 大型文档性能优化项目 - 开发者指南

欢迎加入性能优化项目！这个项目旨在解决大型文档编辑时的严重性能问题。

---

## 📚 文档导航

1. **[性能分析报告](./大型文档性能问题深度分析报告.md)** - 深度技术分析，了解问题根源
2. **[项目管理文档](./PROJECT_MANAGEMENT.md)** - 项目整体规划和时间表
3. **[任务分配清单](./TASK_ASSIGNMENTS.md)** - 具体任务的详细步骤和验收标准

---

## 🚀 快速开始

### 如果你是开发者

1. **阅读性能分析报告**（30分钟）
   - 了解问题的严重性
   - 理解7层调用链路
   - 熟悉性能瓶颈

2. **查看你的任务**（在`TASK_ASSIGNMENTS.md`）
   - Phase 1有3个并行任务
   - 每个任务都有详细的步骤

3. **获取你的任务分支**
   ```bash
   # 例如：任务T1.1 缓存优化
   git checkout perf/phase1-cache-optimization
   ```

4. **开始开发**
   - 按照任务清单的步骤进行
   - 每个步骤都有代码示例
   - 添加单元测试

5. **提交PR**
   - PR到`perf/large-doc-optimization`分支
   - 填写PR模板（包含性能数据）

### 如果你是Review者

1. **查看代码变更**
   - 检查是否符合技术方案
   - 验证测试覆盖率

2. **运行性能测试**
   ```bash
   yarn test:perf
   ```

3. **验证性能提升**
   - 查看PR中的Before/After数据
   - 本地验证性能改善

---

## 🌲 分支说明

```
main  (生产分支)
  └─ perf/large-doc-optimization  (主开发分支)
      ├─ perf/phase1-cache-optimization  (T1.1)
      ├─ perf/phase1-shouldupdate-optimization  (T1.2)
      ├─ perf/phase1-performance-monitoring  (T1.3)
      ├─ perf/phase2-inline-editor-incremental  (T1.4)
      └─ perf/phase2-block-component-split  (T1.5)
```

**分支命名规范**:
- `perf/phase{N}-{feature-name}` - Phase任务分支
- `perf/bugfix-{issue-number}` - 修复分支
- `perf/experiment-{name}` - 实验性分支

---

## 📋 Phase 1 任务一览

### 可并行开发的任务

| 任务 | 负责人 | 分支 | 难度 | 预期收益 |
|------|--------|------|------|---------|
| T1.1 缓存优化 | Dev A | perf/phase1-cache-optimization | ⭐⭐ | 减少30%对象创建 |
| T1.2 shouldUpdate | Dev B | perf/phase1-shouldupdate-optimization | ⭐⭐⭐ | 减少40-60%更新 |
| T1.3 性能监控 | Dev C | perf/phase1-performance-monitoring | ⭐⭐ | 提供数据支持 |

**这3个任务完全独立，可以同时开发！**

---

## 🧪 测试指南

### 运行单元测试
```bash
yarn test
```

### 运行性能测试
```bash
yarn test:perf
```

### 手动性能测试
1. 打开开发者工具
2. 切换到Performance标签
3. 点击录制
4. 在大型文档中输入100个字符
5. 停止录制
6. 分析火焰图

### 性能对比
```bash
# 切换到优化前的分支
git checkout main
yarn dev

# 测试baseline性能
# 记录数据...

# 切换到优化后的分支
git checkout perf/phase1-cache-optimization
yarn dev

# 测试优化后性能
# 对比数据...
```

---

## 📊 性能指标说明

### 关键指标

1. **输入延迟**（最重要）
   - 测量方法：从keydown事件到DOM更新完成
   - 目标：<16ms (60 FPS)

2. **对象创建数量**
   - 测量方法：使用Performance Monitor
   - 目标：减少30-40%

3. **渲染次数**
   - 测量方法：计数render()调用
   - 目标：减少40-60%

4. **CPU占用率**
   - 测量方法：Chrome DevTools
   - 目标：<30%

### 如何测量

```typescript
import { perfMonitor } from '@blocksuite/std';

// 开始监控
perfMonitor.start('keystroke-to-dom');

// 模拟按键
simulateKeyPress('a');

// 等待DOM更新
await nextFrame();

// 结束监控
const duration = perfMonitor.end('keystroke-to-dom');

console.log(`Delay: ${duration}ms`);
```

---

## 🔍 调试技巧

### 1. 查看性能日志

开发模式下，性能监控会自动输出：

```
[Perf] inline-editor-render: 23.45ms
[Perf] block-update-paragraph: 5.67ms
[Perf] render-children-abc123: 45.23ms
```

### 2. 检查对象创建

```typescript
// 在Console中
perfMonitor.getStats();

// 或打印表格
perfMonitor.printStats();
```

### 3. React DevTools Profiler

虽然我们用Lit，但概念类似：
- 查看哪些组件频繁更新
- 查看更新耗时

### 4. Performance API

```typescript
// 标记关键时间点
performance.mark('render-start');
// ... 操作
performance.mark('render-end');

// 测量
performance.measure('render-duration', 'render-start', 'render-end');

// 查看
performance.getEntriesByType('measure');
```

---

## ❓ 常见问题

### Q: 我的任务依赖其他任务吗？

**A**: Phase 1的3个任务完全独立，可以并行开发。Phase 2的任务依赖Phase 1完成。

### Q: 如何解决合并冲突？

**A**:
```bash
# 1. 拉取最新的主分支
git checkout perf/large-doc-optimization
git pull origin perf/large-doc-optimization

# 2. 回到你的分支
git checkout perf/phase1-cache-optimization

# 3. 合并主分支
git merge perf/large-doc-optimization

# 4. 解决冲突
# 5. 提交
git commit
```

### Q: 性能测试失败怎么办？

**A**:
1. 检查是否有明显的性能回归
2. 对比优化前后的数据
3. 使用Chrome DevTools分析瓶颈
4. 在PR中说明，寻求帮助

### Q: 单元测试怎么写？

**A**: 参考`TASK_ASSIGNMENTS.md`中的测试示例，每个任务都有详细的测试用例。

### Q: 如何验证缓存是否生效？

**A**:
```typescript
// 添加日志
console.log('Cache hit:', this._widgetsCache.has(flavour));

// 或使用调试器
debugger;
```

---

## 📞 联系和协作

### 沟通渠道
- **Daily Standup**: 每天早上10:00
- **Slack**: #perf-optimization
- **技术讨论**: 在PR评论区
- **紧急问题**: @项目经理

### Code Review流程
1. 提交PR到`perf/large-doc-optimization`
2. 至少2个reviewer approve
3. 所有测试通过
4. 性能测试达标
5. 合并

### 寻求帮助
- 技术问题：在PR评论区@reviewer
- 进度阻塞：@项目经理
- 理解问题：重新阅读[性能分析报告](./大型文档性能问题深度分析报告.md)

---

## 🎓 学习资源

### 必读文档
1. [性能分析报告](./大型文档性能问题深度分析报告.md) - 了解问题本质
2. [Lit文档](https://lit.dev/docs/) - Lit框架基础
3. [YJS文档](https://docs.yjs.dev/) - CRDT基础

### 推荐阅读
1. Web性能优化最佳实践
2. 虚拟DOM原理
3. React性能优化技巧（可借鉴）

---

## ✅ 开发检查清单

提交PR前请确认：

- [ ] 代码符合项目规范（ESLint无错误）
- [ ] 添加了单元测试（覆盖率>80%）
- [ ] 所有测试通过
- [ ] 性能测试达标（有数据对比）
- [ ] 文档已更新
- [ ] 自测通过（手动测试）
- [ ] PR描述完整（问题+方案+结果）
- [ ] 添加了性能对比截图

---

## 🎯 Phase 1 目标

**时间**: Week 1-2
**目标**: 减少30-40%的性能问题
**关键指标**:
- 大型文档延迟：900ms → 540ms
- 对象创建：减少30-40%
- 更新次数：减少40-60%

**验收标准**:
- 所有任务完成并合并
- 性能指标达标
- 无明显回归
- 文档完善

---

## 📅 重要时间节点

| 日期 | 事件 | 说明 |
|------|------|------|
| Week 1 Friday | 周例会 | 同步进度，讨论问题 |
| Week 2 Friday | Phase 1评审 | 验收成果，决定下一步 |
| Week 6 Friday | Phase 2评审 | 中期评审 |
| Week 12 Friday | 项目完成 | 最终评审 |

---

## 🏆 成功案例

**优化案例1**: React性能优化
- 问题：列表渲染慢
- 方案：虚拟化+memo
- 结果：性能提升10倍

**优化案例2**: Notion编辑器
- 问题：大文档卡顿
- 方案：增量渲染+虚拟滚动
- 结果：丝滑体验

**我们可以做到！**

---

**祝开发顺利！有任何问题随时联系项目组。**

---

**项目状态**: 🟢 进行中
**当前Phase**: Phase 1
**最后更新**: 2025-11-15
