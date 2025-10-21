# 修复 CSS 变量问题指南

## 问题描述
当执行 `getComputedStyle(document.documentElement).getPropertyValue('--yunke-white')` 时返回空字符串。

## 根本原因
CSS 变量未被正确注入到页面中，可能的原因包括：
1. Theme 包需要重新构建
2. 动态注入的CSS与静态CSS冲突
3. CSS文件加载顺序问题
4. 浏览器缓存问题

## 解决方案

### 方案 1: 立即修复（浏览器端）

在浏览器控制台运行：

```javascript
// 1. 检查是否有刷新函数
if (typeof window.__forceRefreshYunkeTheme === 'function') {
  window.__forceRefreshYunkeTheme();
  console.log('Theme refreshed!');
} else {
  console.log('Refresh function not available');
}

// 2. 验证修复
const white = getComputedStyle(document.documentElement).getPropertyValue('--yunke-white');
console.log('--yunke-white value:', white);
```

### 方案 2: 重新构建 Theme 包

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront

# 1. 清理并重新构建 theme 包
cd packages/theme
rm -rf dist
yarn build

# 2. 回到根目录
cd ../..

# 3. 重新安装依赖（如果需要）
yarn install

# 4. 重启开发服务器
yarn dev
```

### 方案 3: 强制清除缓存

```bash
# 1. 停止开发服务器

# 2. 清除缓存
rm -rf packages/frontend/core/.next
rm -rf packages/frontend/core/out
rm -rf node_modules/.cache

# 3. 重新构建 theme
cd packages/theme
yarn build
cd ../..

# 4. 重启开发服务器
yarn dev
```

### 方案 4: 检查并修复代码

确保以下文件正确：

#### 1. packages/frontend/component/src/theme/index.ts
```typescript
import '@toeverything/theme/style.css';
import './fonts.css';
import './global.css';
import './theme.css';
import './apply-yunke-vars';  // 确保这行存在
```

#### 2. packages/frontend/component/src/theme/apply-yunke-vars.ts
确保文件包含以下内容：

```typescript
import {
  combinedDarkCssVariables,
  combinedLightCssVariables,
} from '@toeverything/theme';

// ... 其他代码

injectThemeCssVariables();

if (typeof window !== 'undefined') {
  window.__forceRefreshYunkeTheme = injectThemeCssVariables;
}
```

## 诊断工具

我已经创建了一个诊断脚本：`diagnose-theme.js`

在浏览器控制台运行：

```javascript
// 复制 diagnose-theme.js 的内容到控制台
// 或者在开发工具中加载该文件
```

## 验证修复

在浏览器控制台运行以下命令验证：

```javascript
// 测试所有主要的 CSS 变量
const testVars = [
  '--yunke-white',
  '--yunke-black',
  '--yunke-primary-color',
  '--yunke-background-primary-color',
  '--yunke-text-primary-color'
];

testVars.forEach(varName => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
  console.log(`${varName}: "${value}"`);
});
```

## 如果问题依然存在

### 手动注入CSS变量

创建一个临时修复文件 `packages/frontend/component/src/theme/manual-fix.ts`:

```typescript
// 临时修复：手动注入关键的CSS变量
const criticalVars = {
  '--yunke-white': 'rgb(255, 255, 255)',
  '--yunke-black': 'rgb(0, 0, 0)',
  '--yunke-primary-color': '#1E96EB',
  '--yunke-background-primary-color': 'rgb(255, 255, 255)',
  '--yunke-text-primary-color': 'rgb(18, 18, 18)',
};

if (typeof document !== 'undefined') {
  Object.entries(criticalVars).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });
}
```

然后在 `packages/frontend/component/src/theme/index.ts` 中导入：

```typescript
import '@toeverything/theme/style.css';
import './fonts.css';
import './global.css';
import './theme.css';
import './apply-yunke-vars';
import './manual-fix';  // 临时添加
```

## 后续预防

1. 在每次修改 theme 包后，确保运行 `yarn build`
2. 使用 `yarn workspace @toeverything/theme build` 单独构建 theme 包
3. 在 package.json 中添加 postinstall 脚本自动构建

```json
{
  "scripts": {
    "postinstall": "yarn workspace @toeverything/theme build"
  }
}
```

