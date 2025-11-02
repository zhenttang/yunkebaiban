# 尚未完全统一的网络请求

## 📋 待统一清单

### 🔴 高优先级（需要统一）

#### 1. `desktop/pages/workspace/forum/forum-api.ts`
- **状态**: 使用相对路径 `/api/forum`
- **问题**: 未使用统一配置
- **影响**: 论坛功能在不同环境下可能无法正常工作
- **修复方案**: 使用 `getApiBaseUrl()` 或 `unifiedFetch()`

```typescript
// 当前代码
const API_BASE_URL = '/api/forum';
const url = `${API_BASE_URL}${endpoint}`;
const response = await fetch(url, {...});

// 建议修改为
import { getApiBaseUrl } from '@yunke/config';
const API_BASE_URL = `${getApiBaseUrl()}/forum`;
// 或使用 unifiedFetch
```

#### 2. `desktop/pages/workspace/community/api.ts`
- **状态**: 使用相对路径 `/api/community`
- **问题**: 未使用统一配置
- **影响**: 社区功能在不同环境下可能无法正常工作
- **修复方案**: 使用 `getApiBaseUrl()` 或 `unifiedFetch()`

```typescript
// 当前代码
const API_BASE_URL = '/api/community';
const url = `${API_BASE_URL}${endpoint}`;
const response = await fetch(url, {...});

// 建议修改为
import { getApiBaseUrl } from '@yunke/config';
const API_BASE_URL = `${getApiBaseUrl()}/community`;
// 或使用 unifiedFetch
```

#### 3. `desktop/pages/auth/oauth-login.tsx`
- **状态**: 使用相对路径 `/api/auth/sign-out`
- **问题**: 未使用统一配置
- **影响**: OAuth登录流程可能失败
- **修复方案**: 使用 `getApiBaseUrl()` 或 FetchService

```typescript
// 当前代码（在loader函数中）
await fetch('/api/auth/sign-out');

// 建议修改为
import { getApiBaseUrl } from '@yunke/config';
await fetch(`${getApiBaseUrl()}/auth/sign-out`);
```

### 🟡 中优先级（建议统一）

#### 4. `utils/opus-encoding.ts`
- **状态**: 使用 `new URL(filepath, location.origin)`
- **问题**: 未使用统一配置
- **影响**: 音频编码功能在非标准环境下可能失败
- **说明**: 这是本地资源路径处理，可能需要特殊处理
- **修复方案**: 使用 `getBaseUrl()` 或统一配置

```typescript
// 当前代码
const response = await fetch(new URL(filepath, location.origin));

// 建议修改为
import { getBaseUrl } from '@yunke/config';
const response = await fetch(new URL(filepath, getBaseUrl()));
```

### 🟢 低优先级（合理的，不需要统一）

#### 5. `utils/resource.ts`
- **状态**: ✅ 合理 - fetch外部URL
- **说明**: 用于下载外部资源，使用完整URL，不需要统一

#### 6. `utils/first-app-data.ts`
- **状态**: ✅ 合理 - fetch静态资源
- **说明**: 用于加载静态模板资源（onboardingUrl），使用完整URL，不需要统一

#### 7. 第三方API调用
- **状态**: ✅ 合理 - 第三方服务
- **文件**: 
  - `modules/integration/entities/readwise-crawler.ts` - Readwise API
  - `modules/integration/entities/calendar.ts` - 日历订阅URL
- **说明**: 第三方API不需要使用我们的统一配置

## 📊 统计

- **需要统一**: 4个文件（高优先级3个，中优先级1个）
- **合理的**: 3个文件（外部资源/第三方API）
- **统一度**: 约 **85%+**（如果统一剩余4个文件，将达到 **95%+**）

## 🎯 统一建议

### 优先级1：论坛和社区API（必须统一）
这两个模块是用户功能，应该立即统一：
1. `forum-api.ts` - 影响论坛功能
2. `community-api.ts` - 影响社区功能

### 优先级2：OAuth登录（必须统一）
影响用户登录流程：
3. `oauth-login.tsx` - 影响OAuth登录

### 优先级3：工具函数（建议统一）
4. `opus-encoding.ts` - 音频编码工具

## 📝 统一示例

### 使用 getApiBaseUrl()（推荐）
```typescript
import { getApiBaseUrl } from '@yunke/config';

const API_BASE_URL = `${getApiBaseUrl()}/forum`;
const url = `${API_BASE_URL}${endpoint}`;
const response = await fetch(url, {...});
```

### 使用 unifiedFetch()（推荐，如果无法使用FetchService）
```typescript
import { unifiedFetch } from '@yunke/config';

const response = await unifiedFetch(`/api/forum${endpoint}`, options);
```

### 使用 FetchService（最佳，如果有Framework上下文）
```typescript
import { FetchService } from '@yunke/core/modules/cloud';
import { useService } from '@toeverything/infra';

const fetchService = useService(FetchService);
const response = await fetchService.fetch(`/api/forum${endpoint}`, options);
```

