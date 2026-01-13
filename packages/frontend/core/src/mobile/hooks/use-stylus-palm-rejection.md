# 触控笔防误触功能 (Palm Rejection)

## 功能说明

这个 Hook 实现了智能的触控笔防误触功能，类似 Apple Pencil 的"防掌触"技术。

### 核心功能

✅ **自动检测触控笔**
- 实时监听 Pointer Events
- 识别触控笔（`pointerType === 'pen'`）输入

✅ **智能防误触**
- 检测到触控笔后，自动忽略手指触摸
- 防止手掌/手指误触屏幕影响绘图

✅ **超时恢复**
- 触控笔停止输入一段时间后（默认 8 秒）
- 自动恢复手指触摸功能

✅ **状态管理**
- 提供完整的状态信息
- 拦截计数、触控笔使用统计

## 使用方法

### 基础用法

```tsx
import { useStylusPalmRejection } from '@yunke/core/mobile/hooks/use-stylus-palm-rejection';

function WhiteboardComponent() {
  const {
    hasStylusInput,        // 是否检测到触控笔
    isPalmRejectionActive, // 是否处于防误触模式
    rejectedTouchCount,    // 拦截的手指触摸次数
    stylusInputCount,      // 触控笔输入次数
  } = useStylusPalmRejection({
    enabled: true,         // 启用功能
    timeout: 8000,         // 8秒超时
    debug: false,          // 调试模式
  });

  return (
    <div>
      {isPalmRejectionActive && (
        <div>✍️ 触控笔模式 - 忽略手指触摸</div>
      )}
    </div>
  );
}
```

### 高级配置

```tsx
const palmRejection = useStylusPalmRejection({
  enabled: true,
  timeout: 10000,  // 10秒超时
  debug: true,     // 开启调试日志
  
  // 触控笔检测回调
  onStylusDetected: (isStylus) => {
    console.log('触控笔状态:', isStylus);
  },
  
  // 误触拦截回调
  onTouchRejected: (event) => {
    console.log('拦截手指触摸:', event);
  },
});

// 手动重置
palmRejection.reset();

// 手动启用/禁用
palmRejection.setEnabled(false);
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | true | 启用防误触功能 |
| `timeout` | number | 8000 | 触控笔停止输入后，持续防误触的时间（毫秒） |
| `debug` | boolean | false | 开启调试模式，输出日志 |
| `onStylusDetected` | function | - | 触控笔检测回调 |
| `onTouchRejected` | function | - | 误触拦截回调 |

## 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `hasStylusInput` | boolean | 是否检测到触控笔输入 |
| `isPalmRejectionActive` | boolean | 当前是否处于防误触模式 |
| `rejectedTouchCount` | number | 拦截的手指触摸次数 |
| `stylusInputCount` | number | 触控笔输入次数 |
| `reset()` | function | 重置所有状态 |
| `setEnabled(enabled)` | function | 启用/禁用功能 |

## 工作原理

```
1. 用户用触控笔触摸屏幕
   ↓
2. 检测到 pointerType === 'pen'
   ↓
3. 激活防误触模式
   ↓
4. 拦截所有手指触摸事件（e.preventDefault()）
   ↓
5. 8秒后（或超时时间）
   ↓
6. 自动恢复手指触摸
```

## 适用场景

✅ **白板/画板应用**
- 用触控笔绘图时，手掌不会误触

✅ **笔记应用**
- 用触控笔书写时，防止手部误操作

✅ **绘画/设计应用**
- 精确控制，只响应触控笔

## 支持的设备

- ✅ iPad + Apple Pencil
- ✅ 小米平板 + 小米触控笔
- ✅ 三星 Galaxy Tab + S Pen
- ✅ 华为 MatePad + M-Pencil
- ✅ 其他支持 Pointer Events 的触控笔

## 注意事项

1. **事件拦截优先级高**
   - 使用 `capture: true` 在捕获阶段拦截
   - 确保优先于其他事件处理

2. **超时时间调整**
   - 根据实际使用场景调整 `timeout`
   - 绘图：8-10 秒
   - 书写：5-8 秒

3. **性能影响**
   - 极小，仅监听指针事件
   - 自动清理定时器

4. **兼容性**
   - 需要浏览器支持 Pointer Events API
   - 现代浏览器均支持

## 调试模式

开启 `debug: true` 后，会在控制台输出详细日志：

```
🔴 [Palm Rejection] 已激活 - 忽略手指触摸 { timeout: 8000 }
❌ [Palm Rejection] 拦截手指触摸 { rejectedCount: 5, timeSinceStylus: 1234 }
🟢 [Palm Rejection] 已停用 - 恢复手指触摸
🔄 [Palm Rejection] 已重置
```

## 集成示例

查看 `/mobile/pages/workspace/detail/mobile-detail-page.tsx` 中的完整集成示例。

