# 🎨 安全监控前端管理页面

## 📍 位置

```
packages/frontend/admin/src/modules/settings/security/
```

## 🎯 功能

### 1. 实时安全统计卡片
- 今日安全事件总数
- 当前被封禁IP数量
- DDoS攻击次数
- 暴力破解次数

### 2. 安全事件列表
- 实时显示最近的安全事件
- 按时间排序
- 事件类型标签
- 安全级别标注（低危/中危/高危/严重）
- IP地址、用户ID、请求路径等详细信息
- 自动刷新（每1分钟）

### 3. IP封禁管理
- 当前被封禁的IP列表
- 剩余封禁时间倒计时
- 一键解封功能
- 封禁原因显示
- 自动刷新（每30秒）

### 4. 攻击类型分布图
- 各类攻击占比
- 可视化进度条
- 实时更新

### 5. 实时监控状态
- DDoS防护状态
- SQL注入防护状态
- 爬虫防护状态
- 登录保护状态

## 🚀 访问方式

### 方式1：通过导航菜单

1. 登录 Admin 管理后台
2. 点击左侧导航 "安全与认证"
3. 选择 "安全监控"

### 方式2：直接访问URL

```
http://localhost:8080/admin/settings/security
```

## 📁 文件结构

```
packages/frontend/admin/src/modules/settings/security/
├── index.tsx                          # 主页面组件
├── types.ts                           # TypeScript类型定义
├── hooks/
│   └── use-security-monitor.ts        # 数据获取hooks
└── components/
    ├── security-stats-cards.tsx       # 统计卡片组件
    ├── security-events-list.tsx       # 事件列表组件
    └── blocked-ips-table.tsx          # 封禁IP表格组件
```

## 🔌 API调用

页面自动调用后端API：

```typescript
// 获取安全统计
GET /api/admin/security/stats

// 获取安全事件列表
GET /api/admin/security/events?days=7&limit=50

// 获取被封禁的IP列表
GET /api/admin/security/blocked-ips

// 解封IP
DELETE /api/admin/security/blocked-ips/{ip}

// 手动封禁IP
POST /api/admin/security/block-ip
```

## 📊 数据刷新频率

| 数据类型 | 刷新频率 | 说明 |
|---------|---------|------|
| 安全统计 | 30秒 | 实时性要求高 |
| 安全事件 | 60秒 | 显示最近事件 |
| 封禁IP列表 | 30秒 | 需要实时更新 |

## 🎨 界面截图（功能说明）

### 顶部统计卡片
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 今日安全事件  │ 当前封禁IP   │  DDoS攻击    │  暴力破解    │
│    150       │     5        │    50       │    30       │
│  最近1h: 20  │  今日新增: 8  │  流量攻击    │  登录攻击    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 攻击类型分布
```
DDoS攻击      ████████████░░░░░░░░  50
暴力破解      ██████░░░░░░░░░░░░░░  30
SQL注入       ██░░░░░░░░░░░░░░░░░░  10
恶意爬虫      ████████████████░░░░  60
```

### IP封禁列表
```
┌─────────────────────────────────────────────┐
│ IP: 192.168.1.100                    [解封] │
│ 原因: DDoS攻击 - 请求频率: 101次/分钟       │
│ 剩余: 8分钟                                 │
│ 封禁时间: 2025-11-05 12:00:00              │
└─────────────────────────────────────────────┘
```

### 安全事件时间线
```
🔴 [严重] SQL注入  12:30
   IP: 1.2.3.4  路径: /api/search  动作: REQUEST_BLOCKED
   SQL注入尝试 - 参数: q, 值: admin' union select *

🟡 [中危] API滥用  12:25
   用户: test@example.com  路径: /api/copilot/chat
   AI接口调用超限 - 超过限制: 20次/60分钟

🔴 [高危] DDoS攻击  12:20
   IP: 5.6.7.8  动作: IP_BLOCKED
   请求频率过高: 101次/分钟（限制: 100次）
```

## 💡 使用技巧

### 1. 快速定位恶意IP
1. 查看"当前封禁IP"卡片
2. 如果数量异常增加，立即查看IP封禁列表
3. 检查封禁原因，判断攻击类型

### 2. 分析攻击趋势
1. 观察"今日安全事件"趋势
2. 查看"攻击类型分布"
3. 如果某类攻击突然增加，需要排查原因

### 3. 处理误封禁
1. 在"IP封禁列表"中找到误封的IP
2. 点击"解封"按钮
3. 建议：调整配置文件中的限流阈值

### 4. 查看历史事件
1. 安全事件列表默认显示最近7天
2. 向下滚动查看更多事件
3. 根据时间、IP、事件类型进行分析

## 🛠️ 开发说明

### 添加新的统计指标

1. 修改后端API返回数据
2. 更新 `types.ts` 中的 `SecurityStats` 类型
3. 在 `security-stats-cards.tsx` 中添加新的卡片

### 添加新的事件类型

1. 在 `types.ts` 中的 `SecurityEventType` 添加新类型
2. 在 `EVENT_TYPE_LABELS` 中添加中文标签
3. 后端也需要同步更新

### 自定义刷新频率

修改 hooks 中的 `refetchInterval` 参数：

```typescript
export function useSecurityStats() {
  return useQuery({
    queryKey: ['security', 'stats'],
    queryFn: async () => { /* ... */ },
    refetchInterval: 30000, // 修改这里的毫秒数
  });
}
```

## 🔒 权限要求

- **访问页面**：需要管理员(ADMIN)角色
- **查看数据**：需要有效的JWT Token
- **解封IP**：需要管理员权限

## 📝 注意事项

1. **性能影响**：页面会定期刷新数据，如果数据量很大可能影响性能
2. **权限校验**：所有API调用都需要在Header中携带Authorization Token
3. **数据存储**：所有数据存储在Redis中，重启Redis会丢失历史数据
4. **时区问题**：时间显示使用本地时区

## 🐛 常见问题

### Q1: 页面显示"数据加载失败"
**A:** 检查：
1. 后端服务是否运行
2. Redis是否正常运行
3. 浏览器控制台是否有错误
4. Token是否有效

### Q2: 解封IP失败
**A:** 检查：
1. 是否有管理员权限
2. 后端日志中的错误信息
3. Redis连接是否正常

### Q3: 数据不刷新
**A:** 检查：
1. 网络连接是否正常
2. 浏览器控制台是否有错误
3. 尝试手动点击"刷新"按钮

## 🔗 相关文档

- [后端安全防护完整文档](../baibanhouduan/yunke-java-backend/SECURITY_PROTECTION_README.md)
- [后端快速上手指南](../baibanhouduan/yunke-java-backend/SECURITY_QUICK_START.md)
- [安全配置说明](../baibanhouduan/yunke-java-backend/src/main/resources/application-security.yml)

---

**创建时间**：2025-11-05  
**版本**：1.0.0

