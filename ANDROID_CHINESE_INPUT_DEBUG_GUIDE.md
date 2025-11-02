# Android 中文输入调试日志分析指南

## 📋 调试日志说明

已添加详细的调试日志到以下关键位置：

### 1. 事件处理日志

#### `compositionstart` 事件
- 记录事件开始
- 记录 range 信息
- 记录保存的 inlineRange

#### `compositionend` 事件
- 记录事件开始和 `event.data`
- 记录 range 检查结果
- 记录 inlineRange 获取过程
- 记录文本获取的多种尝试方式
- 记录最终获取的文本和字符编码
- 记录插入文本前后的 yText 状态
- 记录 DOM 检查结果（包括字体信息）

#### `insertText` 方法
- 记录调用参数（文本、位置、字符编码）
- 记录 yText 插入前后的状态
- 记录是否成功插入

#### `render` 方法
- 记录渲染开始和字体信息
- 记录 chunks 处理过程
- 记录渲染后的 DOM 状态
- 记录是否发现中文字符

#### `yText` 变化监听
- 记录 yText 变化触发
- 记录文本内容

---

## 🔍 问题排查步骤

### 步骤 1: 检查事件是否触发

在 Chrome DevTools 控制台查看：

```
🔍 [Android调试] compositionstart 开始
🔍 [Android调试] compositionend 开始
```

如果没有这些日志，说明事件没有触发，可能是：
- 输入法没有正确触发 composition 事件
- 事件监听器没有正确绑定

### 步骤 2: 检查文本数据获取

查看日志：

```
🔍 [Android调试] compositionend 文本获取 - 初始
⚠️ [Android调试] compositionend event.data 为空，尝试其他方法获取文本
```

**关键问题**:
- `event.data` 是否为空？
- 如果为空，是否通过其他方法获取到了文本？

### 步骤 3: 检查文本是否插入到 yText

查看日志：

```
✅ [Android调试] insertText 调用
✅ [Android调试] insertText 完成
```

**关键检查**:
- `yTextLengthBefore` 和 `yTextLengthAfter` 是否增加？
- `textInserted` 是否为 `true`？
- `yTextStringAfter` 中是否包含输入的文本？

### 步骤 4: 检查文本是否渲染到 DOM

查看日志：

```
🔍 [Android调试] render 完成，DOM 检查（延迟50ms）
```

**关键检查**:
- `domText` 中是否包含输入的文本？
- `textInDOM` 是否为 `true`？
- 是否发现中文字符？

### 步骤 5: 检查字体问题

查看日志中的字体信息：

```
rootElementFontFamily: "..."
rootElementFontSize: "..."
```

**可能的问题**:
- 字体不支持中文？
- 字体大小太小？
- 字体颜色与背景色相同？

---

## 🎯 关键日志位置

### 如果文本没有插入到 yText

查看这些日志：
```
❌ [Android调试] compositionend 事件中没有文本数据，无法插入
```

**原因**:
- `event.data` 为空
- 无法从 range 或 selection 中获取文本
- `compositionText` 最终为空

### 如果文本插入到 yText 但没有显示

查看这些日志：
```
✅ [Android调试] insertText 完成
🔍 [Android调试] render 完成，DOM 检查
```

**检查**:
- `textInserted` 是否为 `true`？
- `textInDOM` 是否为 `false`？
- 如果 `textInserted` 为 `true` 但 `textInDOM` 为 `false`，说明渲染有问题

### 如果文本在 DOM 中但不显示

查看字体相关日志：
```
rootElementFontFamily: "..."
rootElementColor: "..."
rootElementVisibility: "..."
rootElementDisplay: "..."
```

**可能的原因**:
- 字体不支持中文
- 颜色与背景色相同
- visibility 或 display 属性导致不可见

---

## 🔧 字体相关问题分析

### 常见字体问题

1. **字体不支持中文**
   - 某些字体（如 Arial、Helvetica）可能不包含中文字符
   - 需要使用支持中文的字体（如 "Microsoft YaHei", "PingFang SC", "SimHei"）

2. **字体回退问题**
   - 如果指定的字体不支持中文，浏览器应该回退到系统字体
   - 但某些情况下可能不会正确回退

3. **字体加载问题**
   - Web 字体可能未加载完成
   - 导致中文显示为空白或方块

### 检查字体支持

在控制台运行：

```javascript
// 检查当前字体
const el = document.querySelector('[contenteditable="true"]');
const computedStyle = window.getComputedStyle(el);
console.log('字体:', computedStyle.fontFamily);
console.log('字体大小:', computedStyle.fontSize);
console.log('字体颜色:', computedStyle.color);

// 检查字体是否支持中文
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = computedStyle.fontSize + ' ' + computedStyle.fontFamily;
const metrics = ctx.measureText('你好');
console.log('中文宽度:', metrics.width);
// 如果宽度为0或很小，可能不支持中文
```

---

## 📊 调试日志示例

### 正常情况下的日志流程

```
1. 🔍 [Android调试] compositionstart 开始
2. 🔍 [Android调试] compositionstart range 信息
3. 🔍 [Android调试] compositionstart 保存 inlineRange
4. 🔍 [Android调试] compositionend 开始 { eventData: "你好" }
5. 🔍 [Android调试] compositionend 最终获取的文本 { compositionText: "你好" }
6. ✅ [Android调试] insertText 调用 { text: "你好" }
7. ✅ [Android调试] insertText 完成 { textInserted: true }
8. 🔍 [Android调试] yText 变化触发
9. 🔍 [Android调试] render 开始
10. 🔍 [Android调试] render 完成，DOM 检查 { textInDOM: true }
```

### 异常情况下的日志

**情况1: event.data 为空**
```
🔍 [Android调试] compositionend 文本获取 - 初始 { eventData: null }
⚠️ [Android调试] compositionend event.data 为空，尝试其他方法获取文本
❌ [Android调试] compositionend 事件中没有文本数据，无法插入
```

**情况2: 文本插入但未渲染**
```
✅ [Android调试] insertText 完成 { textInserted: true }
🔍 [Android调试] render 完成，DOM 检查 { textInDOM: false }
```

**情况3: 文本在 DOM 中但不显示**
```
🔍 [Android调试] render 完成，DOM 检查 { 
  domText: "你好",
  textInDOM: true,
  rootElementFontFamily: "Arial, sans-serif"  // 可能不支持中文
}
```

---

## 🔍 下一步行动

根据日志结果：

1. **如果 event.data 为空**:
   - 需要改进文本获取逻辑
   - 可能需要从 DOM 中读取

2. **如果文本没有插入到 yText**:
   - 检查 `insertText` 方法的调用
   - 检查是否有错误阻止插入

3. **如果文本在 yText 中但不在 DOM**:
   - 检查 `render` 方法
   - 检查是否有渲染错误

4. **如果文本在 DOM 中但不显示**:
   - 检查字体支持
   - 检查 CSS 样式
   - 检查元素可见性

---

## 📝 测试步骤

1. 在 Android 设备上打开应用
2. 打开 Chrome DevTools 远程调试
3. 切换到中文输入法
4. 输入中文（如"你好"）
5. 查看控制台日志
6. 按照上述步骤分析问题

---

## 💡 字体修复建议

如果确认是字体问题，可以：

1. **添加中文字体支持**:
   ```css
   font-family: "Microsoft YaHei", "PingFang SC", "SimHei", "Arial", sans-serif;
   ```

2. **强制使用系统字体**:
   ```css
   font-family: system-ui, -apple-system, sans-serif;
   ```

3. **检查字体加载**:
   ```javascript
   document.fonts.ready.then(() => {
     console.log('字体加载完成');
   });
   ```

