# 前端重复日志和连接超时问题分析

## 问题现象

1. **`network-config.js:179` 日志重复输出43次**
   - 日志内容：`📍 [NetworkConfig] getBaseUrl返回: http://localhost:8080, 环境: development`
   - 说明 `getBaseUrl()` 被频繁调用

2. **`StoreManagerClient` 连接超时（15秒）出现2次**
   - 日志内容：`⏱️ [StoreManagerClient] 等待连接超时（15秒）`
   - 说明云端存储连接建立失败或超时

3. **用户反馈：失败和成功都会出现这些日志**

## 根本原因分析

### 1. `getBaseUrl()` 被频繁调用的原因

#### 问题1：缺少缓存机制
- `getBaseUrl()` 每次调用都会执行计算逻辑
- 虽然计算简单，但在高频调用场景下会产生大量日志

#### 问题2：多个模块同时调用
根据代码分析，以下位置会调用 `getBaseUrl()`：

1. **`share-page.tsx`** - 分享页面配置存储
   ```typescript
   serverBaseUrl: getBaseUrl(),  // 多次调用
   ```

2. **`cloud.ts` (CloudWorkspaceFlavourProvider)** - 工作区引擎配置
   ```typescript
   const baseOrigin = getBaseUrl();
   ```

3. **`fetch.ts`** - 网络请求服务
   ```typescript
   const baseUrl = input.startsWith('/api') ? getBaseUrl() : getApiBaseUrl();
   ```

4. **`constant.ts`** - 云存储常量
   ```typescript
   return getBaseUrl();
   ```

#### 问题3：日志输出位置不明
- 源代码中 `dlog` 已被设置为 `no-op`（第106行）
- 但用户仍看到日志输出，说明：
  - 可能是编译后的代码中有日志
  - 或者有其他文件在调用并输出日志
  - 或者 `dlog` 在某些环境下被重新定义

### 2. `StoreManagerClient` 连接超时的原因

#### 问题1：连接超时时间过短
- 当前超时时间：15秒
- 在网络不稳定或服务器响应慢的情况下可能不够

#### 问题2：连接失败后没有重试机制
- 代码位置：`client.ts:108`
- 超时后直接抛出错误，没有重试逻辑

#### 问题3：多个工作区同时初始化
- 如果有多个工作区同时打开，每个都会尝试建立连接
- 可能导致连接竞争或资源耗尽

## 详细代码分析

### `network-config.ts` 日志输出

```typescript
// 第106行：dlog 被设置为 no-op
function dlog(..._args: any[]) { /* no-op */ }

// 第184行：环境检测时输出日志
dlog('🔧 [NetworkConfig] 使用默认开发环境');

// 第216-224行：getBaseUrl() 方法
getBaseUrl(): string {
  const config = this.getCurrentConfig();
  // ... 计算逻辑
  return baseUrl;
}
```

**问题**：虽然 `dlog` 是 no-op，但用户看到的日志格式 `📍 [NetworkConfig] getBaseUrl返回: ...` 不在源代码中，可能是：
1. 编译后的代码添加了日志
2. 浏览器开发者工具的 Source Map 映射问题
3. 有其他文件在调用并输出日志

### `client.ts` 连接超时

```typescript
// 第104-116行：等待连接就绪，设置15秒超时
const waitPromise = cloudDocStorage.connection.waitForConnected();
const waitTimeoutPromise = new Promise<void>((_, reject) => 
  setTimeout(() => {
    console.error('⏱️ [StoreManagerClient] 等待连接超时（15秒）:', {
      connectionStatus: cloudDocStorage?.connection?.status,
      connectionError: cloudDocStorage?.connection?.error
    });
    reject(new Error('等待连接就绪超时（15秒）'));
  }, 15000)
);

await Promise.race([waitPromise, waitTimeoutPromise]);
```

**问题**：
1. 超时时间固定为15秒，无法根据网络情况调整
2. 超时后没有重试机制
3. 错误信息不够详细，难以诊断问题

## 解决方案

### 方案1：添加缓存机制（推荐）

在 `NetworkConfigManager` 中添加缓存：

```typescript
class NetworkConfigManager {
  private _baseUrlCache: string | null = null;
  
  getBaseUrl(): string {
    // ✅ 使用缓存，避免重复计算和日志输出
    if (this._baseUrlCache !== null) {
      return this._baseUrlCache;
    }
    
    const config = this.getCurrentConfig();
    const isStandardPort = (config.protocol === 'http' && config.port === 80) ||
                          (config.protocol === 'https' && config.port === 443);
    this._baseUrlCache = isStandardPort
      ? `${config.protocol}://${config.host}`
      : `${config.protocol}://${config.host}:${config.port}`;
    
    return this._baseUrlCache;
  }
  
  // ✅ 当环境改变时清除缓存
  setEnvironment(env: string): void {
    if (environments[env]) {
      this.currentEnvironment = env;
      this._baseUrlCache = null; // 清除缓存
    }
  }
}
```

### 方案2：移除或条件化日志输出

确保 `dlog` 在所有环境下都是 no-op，或者添加条件判断：

```typescript
// ✅ 只在开发环境且明确启用调试时输出日志
function dlog(...args: any[]) {
  if (import.meta.env?.DEV && 
      (window as any).__YUNKE_DEBUG_NETWORK_CONFIG__) {
    console.log(...args);
  }
}
```

### 方案3：优化连接超时处理

1. **增加超时时间**：根据环境动态调整
2. **添加重试机制**：失败后自动重试
3. **改进错误信息**：提供更详细的诊断信息

```typescript
// ✅ 改进的连接超时处理
const waitForConnection = async (
  cloudDocStorage: any,
  retries = 3,
  baseTimeout = 15000
): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      const timeout = baseTimeout * (i + 1); // 递增超时时间
      const waitPromise = cloudDocStorage.connection.waitForConnected();
      const waitTimeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => {
          reject(new Error(`等待连接超时（${timeout}ms），重试 ${i + 1}/${retries}`));
        }, timeout)
      );
      
      await Promise.race([waitPromise, waitTimeoutPromise]);
      return; // 成功连接
    } catch (error) {
      if (i === retries - 1) {
        // 最后一次重试失败，抛出错误
        throw error;
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 方案4：减少不必要的调用

分析调用链，找出可以优化的地方：

1. **共享页面**：只在初始化时调用一次，缓存结果
2. **工作区引擎**：使用依赖注入，避免重复调用
3. **网络请求服务**：缓存 baseUrl，避免每次请求都调用

## 实施建议

### 优先级1：立即修复（高优先级）
1. ✅ 添加 `getBaseUrl()` 缓存机制
2. ✅ 移除或条件化日志输出
3. ✅ 优化连接超时处理

### 优先级2：后续优化（中优先级）
1. 分析调用链，减少不必要的调用
2. 添加连接重试机制
3. 改进错误处理和日志记录

### 优先级3：长期改进（低优先级）
1. 统一日志系统，使用统一的日志级别
2. 添加性能监控，追踪高频调用
3. 优化初始化流程，减少并发连接

## 测试建议

1. **验证缓存机制**：
   - 多次调用 `getBaseUrl()`，确认只计算一次
   - 改变环境后，确认缓存被清除

2. **验证日志减少**：
   - 刷新页面，检查日志输出次数
   - 确认不再有重复的 `getBaseUrl` 日志

3. **验证连接超时**：
   - 模拟网络延迟，测试重试机制
   - 确认错误信息更详细

4. **性能测试**：
   - 测量初始化时间
   - 检查内存使用情况

## 总结

**核心问题**：
1. `getBaseUrl()` 缺少缓存，导致频繁调用和日志输出
2. `StoreManagerClient` 连接超时处理不够健壮

**解决方案**：
1. 添加缓存机制，减少重复计算
2. 移除或条件化日志输出
3. 优化连接超时处理，添加重试机制

**预期效果**：
- 日志输出减少90%以上
- 连接成功率提升
- 初始化性能改善

