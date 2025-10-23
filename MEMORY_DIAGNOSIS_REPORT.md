# 内存占用分析报告 - http://localhost:8081

**分析时间**: 2025年10月23日  
**工具**: Chrome DevTools MCP

---

## 📊 整体内存状况

### JavaScript 堆内存
- **已使用**: 173.09 MB / 193.33 MB (总分配)
- **限制**: 4095.75 MB
- **使用率**: 89.5% (已使用/已分配)
- **状态**: ⚠️ 使用率较高

### DOM 统计
- **总 DOM 节点**: 1,059 个
- **脚本**: 4 个
- **样式表**: 538 个 ⚠️ **严重异常！**
- **图片**: 1 个
- **SVG 元素**: 50 个
- **Canvas 元素**: 0 个
- **文档大小**: 761 KB

---

## 🔴 发现的核心问题

### 问题 1: 大量内联样式标签 (严重)

**发现内容**:
- HEAD 标签中有 **536 个 `<style>` 标签**
- HEAD 总共有 **561 个子元素**（536 style + 20 meta + 4 link + 1 title）
- 总 CSS 内容大小: **670,570 字符** (约 655 KB)

**正常值对比**:
- 正常网站: 5-20 个样式标签
- **当前网站**: 536 个 ❌
- **异常程度**: 超过正常值 **26-100 倍**

**具体数据**:
```
样式标签 #1: 85,886 字符 (84 KB) - 主题变量
样式标签 #2: 39 字符 - 小组件样式  
样式标签 #3: 61,923 字符 (60 KB) - 字体和基础样式
样式标签 #4: 3,328 字符 - 字体定义
样式标签 #5: 2,614 字符 - 全局重置
... 还有 531 个
```

**重复分析**:
- 总样式标签: 538 个
- 唯一 CSS 模式: 534 个
- 重复组: 仅 2 组
  - AI chat block 样式: 重复 4 次
  - Radix 滚动区域: 重复 2 次

**结论**: 不是样式重复导致的问题，而是**样式数量本身过多**。

---

## 🔍 根本原因分析

### 可能的原因

#### 1. CSS-in-JS 库配置问题
您的项目可能使用了 CSS-in-JS 库（如 emotion、styled-components、vanilla-extract），但配置不当：

**问题表现**:
- 每个组件实例都创建新的样式标签
- 样式没有被复用（应该通过类名复用）
- 开发模式下禁用了样式合并

**证据**:
```javascript
// 看到的样式标签模式：
<style>.yunke-1p9zjho{width:10px;height:20px;}</style>
<style>.button_button__uz65qle{...}</style>
<style>.styles_dropdownBtn__x8cu4h0{...}</style>
```
这些都是动态生成的类名，说明使用了 CSS-in-JS。

#### 2. 组件挂载/卸载时样式未清理
- 组件卸载时，对应的 `<style>` 标签没有被移除
- 导致样式标签不断累积

#### 3. 动态主题切换导致样式累积
- 每次主题切换都创建新的样式标签
- 旧的样式标签没有被清理

#### 4. Blocksuite/白板组件的样式管理问题
- 白板中每个元素都创建独立的样式
- 样式没有统一管理和复用

---

## 🎯 具体影响

### 性能影响

1. **内存占用高**
   - 655 KB CSS 内容常驻内存
   - 536 个 DOM 节点占用内存
   - JS 对象引用占用内存

2. **样式重计算缓慢**
   - 浏览器需要遍历 536 个样式表
   - 每次 DOM 变化都触发大量计算
   - 影响页面响应速度

3. **DOM 操作缓慢**
   - HEAD 元素过大（561 个子元素）
   - 插入新样式需要遍历现有样式
   - 影响组件挂载速度

4. **首屏加载慢**
   - 需要解析大量 CSS
   - 样式表构建耗时

---

## 💡 解决方案

### 方案 1: 检查 CSS-in-JS 配置 (推荐)

检查您的 CSS-in-JS 库配置：

**如果使用 @emotion/react**:
```typescript
// 确保启用了样式缓存和复用
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const cache = createCache({
  key: 'yunke',
  // 启用样式复用
  speedy: true, // 生产模式使用
});

<CacheProvider value={cache}>
  <App />
</CacheProvider>
```

**如果使用 vanilla-extract**:
```typescript
// vite.config.ts
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default {
  plugins: [
    vanillaExtractPlugin({
      // 确保在生产模式下提取 CSS
      identifiers: 'short',
    }),
  ],
};
```

### 方案 2: 实现样式清理机制

为组件添加清理逻辑：

```typescript
// 在组件卸载时清理样式
useEffect(() => {
  return () => {
    // 清理当前组件创建的样式标签
    const styleId = `style-${componentId}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  };
}, []);
```

### 方案 3: 合并和提取关键样式

将常用样式提取到静态 CSS 文件：

```typescript
// 1. 识别最大的样式标签（85KB 和 61KB 的那两个）
// 2. 提取到独立的 CSS 文件
// 3. 在 HTML 中静态引入

// index.html
<link rel="stylesheet" href="/styles/theme.css">
<link rel="stylesheet" href="/styles/base.css">
```

### 方案 4: 限制样式标签数量

添加样式标签监控和清理：

```typescript
// 定期清理过期的样式标签
function cleanupOldStyles() {
  const styleTags = document.querySelectorAll('head > style');
  
  if (styleTags.length > 100) {
    console.warn(`⚠️ 样式标签过多: ${styleTags.length}`);
    
    // 移除没有被使用的样式（需要谨慎）
    // 实现样式使用检测逻辑
  }
}

// 每分钟检查一次
setInterval(cleanupOldStyles, 60000);
```

### 方案 5: 使用样式提取构建优化

确保生产构建时样式被提取：

```typescript
// vite.config.ts
export default {
  build: {
    cssCodeSplit: true, // 启用 CSS 代码分割
    cssMinify: true,     // 压缩 CSS
  },
};
```

---

## 🔧 立即可执行的调试步骤

### 步骤 1: 找出样式来源

在浏览器控制台执行：

```javascript
// 分析样式标签的创建来源
const styleTags = document.querySelectorAll('style');
const sources = {};

styleTags.forEach((style, i) => {
  const content = style.textContent;
  let source = 'unknown';
  
  if (content.includes('yunke-')) source = 'yunke-components';
  else if (content.includes('button_button')) source = 'button-components';
  else if (content.includes('styles_')) source = 'styled-components';
  else if (content.includes('@emotion')) source = 'emotion';
  else if (content.includes('radix')) source = 'radix-ui';
  else if (content.includes('@font-face')) source = 'fonts';
  else if (content.includes(':root')) source = 'theme-vars';
  
  sources[source] = (sources[source] || 0) + 1;
});

console.table(sources);
```

### 步骤 2: 监控样式标签增长

```javascript
// 监控样式标签数量变化
let lastCount = document.querySelectorAll('style').length;

setInterval(() => {
  const currentCount = document.querySelectorAll('style').length;
  if (currentCount !== lastCount) {
    console.log(`📈 样式标签数量变化: ${lastCount} → ${currentCount} (+${currentCount - lastCount})`);
    lastCount = currentCount;
  }
}, 1000);
```

### 步骤 3: 查找最大的样式标签

```javascript
// 找出占用最多内存的样式
const styleTags = Array.from(document.querySelectorAll('style'));
const sorted = styleTags
  .map((s, i) => ({
    index: i,
    size: s.textContent.length,
    preview: s.textContent.substring(0, 100)
  }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 10);

console.table(sorted);
```

---

## 📈 监控指标

### 正常值参考

| 指标 | 正常值 | 当前值 | 状态 |
|------|--------|--------|------|
| Style 标签数 | 5-20 | 536 | ❌ 严重超标 |
| HEAD 子元素数 | 10-50 | 561 | ❌ 严重超标 |
| CSS 内容大小 | 50-200 KB | 655 KB | ⚠️ 偏高 |
| JS 堆使用率 | <70% | 89.5% | ⚠️ 偏高 |
| DOM 节点数 | <1500 | 1059 | ✅ 正常 |

### 优化目标

| 指标 | 当前 | 目标 | 改善 |
|------|------|------|------|
| Style 标签数 | 536 | <50 | -90% |
| CSS 内容大小 | 655 KB | <200 KB | -70% |
| JS 堆使用率 | 89.5% | <60% | -30% |

---

## 🚀 优先级排序

### 🔴 高优先级（立即处理）
1. **找出样式标签来源** - 执行调试步骤 1
2. **检查 CSS-in-JS 配置** - 确认是否正确配置
3. **监控样式增长** - 执行调试步骤 2，观察什么操作导致增长

### 🟡 中优先级（本周处理）
1. **提取大型样式到静态文件** - 处理那两个 80KB+ 的样式
2. **实现样式清理机制** - 组件卸载时清理
3. **添加样式数量监控** - 超过阈值时告警

### 🟢 低优先级（优化阶段）
1. **代码分割优化** - 按路由分割 CSS
2. **样式复用优化** - 减少重复样式
3. **构建优化** - 生产环境样式提取

---

## 📝 建议的下一步操作

1. **立即**: 在浏览器控制台执行"步骤 1"，找出样式来源
2. **今天**: 检查项目中的 CSS-in-JS 配置文件
3. **明天**: 实现样式监控，观察用户操作时的样式增长
4. **本周**: 根据监控结果，实施对应的解决方案

---

## 🔗 相关文件

需要检查的文件：
- `vite.config.ts` - 构建配置
- `packages/theme/` - 主题相关配置
- CSS-in-JS 库的配置文件
- 组件中的样式定义

---

**分析完成** ✅

这个问题的核心是 **536 个内联样式标签** 导致的内存占用高。建议优先执行调试步骤找出样式来源，然后根据来源选择对应的解决方案。

