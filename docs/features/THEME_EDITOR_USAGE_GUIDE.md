# 主题编辑器使用指南

## 如何使主题编辑器生效

### 1. 启用 Feature Flag

主题编辑器需要 `enable_theme_editor` feature flag 开启才能生效。

**检查方法：**
- 打开应用设置 → 实验性功能
- 查找 "启用主题编辑器" 选项
- 确保它已开启

**默认状态：**
- Canary 版本：默认开启
- 正式版本：需要手动开启

### 2. 使用主题编辑器

1. **打开主题编辑器**
   - 方式1：在设置 → 外观 → 自定义主题 → 打开
   - 方式2：直接访问 `/theme-editor` 页面

2. **编辑主题变量**
   - 在左侧树中选择要编辑的分类
   - 在右侧选择要修改的变量
   - 点击颜色块或输入框修改值
   - 修改会**实时生效**，无需刷新页面

3. **查看效果**
   - **重要**：主题编辑器的修改会应用到**整个应用**，包括：
     - 主工作区页面
     - 文档编辑页面
     - 所有使用主题变量的组件
   - 在主题编辑器页面本身可能看不到明显效果（因为主题编辑器页面使用了独立的样式）
   - **建议**：打开另一个窗口查看主应用页面，或在新标签页打开主应用

### 3. 主题应用的时机

主题会在以下情况自动应用：
- ✅ 修改变量值时（实时生效）
- ✅ 切换明亮/暗黑模式时
- ✅ 刷新页面时（主题数据保存在 localStorage 中）
- ✅ 重新打开应用时

### 4. 主题失效的情况

主题会在以下情况失效：
- ❌ 清除浏览器 localStorage（数据被清除）
- ❌ 调用 `themeEditor.reset()` 方法（重置按钮）
- ❌ 关闭 `enable_theme_editor` feature flag
- ❌ 切换到隐私模式（localStorage 不可用）

### 5. 如何重置主题

1. **在主题编辑器中**：点击设置页面的"重置"按钮
2. **在代码中**：调用 `themeEditor.reset()`
3. **手动清除**：清除浏览器 localStorage 中的 `custom-theme` 键

### 6. 数据存储位置

- **存储位置**：浏览器 localStorage
- **存储键名**：`custom-theme`
- **数据格式**：
  ```json
  {
    "light": {
      "--yunke-block-callout-icon-blue": "#53b2ef",
      ...
    },
    "dark": {
      "--yunke-block-callout-icon-blue": "#2f94d5",
      ...
    }
  }
  ```

### 7. 主题编辑器页面看不到效果的原因

主题编辑器页面使用了独立的样式系统，可能不会显示自定义主题的效果。要查看实际效果：

1. **打开主应用页面**（在另一个标签页或窗口）
2. **编辑主题变量**
3. **切换到主应用页面查看效果**

或者，你也可以：
- 编辑 `layer/background/primary` 等全局背景色变量
- 这些变量会应用到主题编辑器页面本身

### 8. 调试技巧

如果主题没有生效，检查以下内容：

1. **Feature Flag 是否开启**
   ```javascript
   // 在浏览器控制台执行
   localStorage.getItem('feature-flags')
   // 检查 enable_theme_editor 是否为 true
   ```

2. **主题数据是否存在**
   ```javascript
   // 在浏览器控制台执行
   localStorage.getItem('custom-theme')
   // 应该返回包含 light 和 dark 的对象
   ```

3. **CSS 变量是否应用**
   ```javascript
   // 在浏览器控制台执行
   getComputedStyle(document.documentElement).getPropertyValue('--yunke-block-callout-icon-blue')
   // 应该返回你设置的值
   ```

4. **检查是否有错误**
   - 打开浏览器开发者工具
   - 查看 Console 标签是否有错误
   - 查看 Network 标签确认资源加载正常

### 9. 版本说明

- **v1**：旧版本主题变量（`--yunke-xxx`）
- **v2**：新版本主题变量（`--yunke-v2-xxx`）
- 两个版本是独立的，切换版本会显示不同的变量列表

### 10. 注意事项

- ⚠️ 修改主题变量会影响整个应用的视觉外观
- ⚠️ 建议在修改前先备份当前主题（导出 localStorage 数据）
- ⚠️ 某些变量之间有依赖关系，修改一个可能影响其他相关元素
- ⚠️ 暗黑模式和明亮模式需要分别配置
- ⚠️ 主题数据存储在 localStorage 中，清除浏览器数据会丢失自定义主题

