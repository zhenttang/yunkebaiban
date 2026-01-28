# 云客白板多维表格功能开发计划

**创建日期**: 2026-01-28  
**目标**: 实现飞书多维表格完整功能  
**代码位置**: `baibanfront/blocksuite/yunke/data-view/`

---

## 一、开发进度总览

### 阶段一：基础字段扩展（预计 3-5 天）
| 序号 | 功能 | 状态 | 开发日期 |
|-----|------|------|---------|
| 1.1 | 评分字段（星级） | ✅ 已完成 | 2026-01-28 |
| 1.2 | 系统字段（创建人/时间、修改人/时间） | ✅ 已完成 | 2026-01-28 |
| 1.3 | 附件字段 | ✅ 已完成 | 2026-01-28 |
| 1.4 | URL 链接字段 | ✅ 已完成 | 2026-01-28 |
| 1.5 | 电话字段 | ✅ 已完成 | 2026-01-28 |
| 1.6 | 邮箱字段 | ✅ 已完成 | 2026-01-28 |

### 阶段二：高级字段（预计 5-7 天）
| 序号 | 功能 | 状态 | 开发日期 |
|-----|------|------|---------|
| 2.1 | 公式字段 | ✅ 已完成 | 2026-01-28 |
| 2.2 | 人员字段 | ✅ 已完成 | 2026-01-28 |
| 2.3 | 关联字段（单向） | ✅ 已完成 | 2026-01-28 |
| 2.4 | 关联字段（双向） | ✅ 已完成 | 2026-01-28 |
| 2.5 | 汇总字段（Rollup） | ✅ 已完成 | 2026-01-28 |
| 2.6 | 地理位置字段 | ✅ 已完成 | 2026-01-28 |

### 阶段三：筛选与视图增强（预计 3-4 天）
| 序号 | 功能 | 状态 | 开发日期 |
|-----|------|------|---------|
| 3.1 | 日期相对筛选（过去N天/未来N天） | ✅ 已完成 | 2026-01-28 |
| 3.2 | 空值/非空值筛选 | ✅ 已存在 | - |
| 3.3 | 视图模板 | ✅ 已完成 | 2026-01-28 |
| 3.4 | 视图复制/导出 | ⬜ 待开发 | |

### 阶段四：数据导入导出（预计 2-3 天）
| 序号 | 功能 | 状态 | 开发日期 |
|-----|------|------|---------|
| 4.1 | CSV 导出 | ✅ 已完成 | 2026-01-28 |
| 4.2 | CSV 导入 | ✅ 已完成 | 2026-01-28 |
| 4.3 | Excel 导出 | ⬜ 待开发 | |
| 4.4 | Excel 导入 | ⬜ 待开发 | |

### 阶段五：协作功能（预计 3-4 天）
| 序号 | 功能 | 状态 | 开发日期 |
|-----|------|------|---------|
| 5.1 | 单元格评论 | ⬜ 待开发 | |
| 5.2 | @提及通知 | ⬜ 待开发 | |
| 5.3 | 数据变更历史 | ⬜ 待开发 | |
| 5.4 | 视图权限控制 | ⬜ 待开发 | |

### 阶段六：自动化与集成（预计 5-7 天）
| 序号 | 功能 | 状态 | 开发日期 |
|-----|------|------|---------|
| 6.1 | 自动化规则引擎 | ⬜ 待开发 | |
| 6.2 | 条件触发器 | ⬜ 待开发 | |
| 6.3 | Webhook 支持 | ⬜ 待开发 | |
| 6.4 | REST API | ⬜ 待开发 | |

---

## 二、详细设计文档

### 1.1 评分字段（Rating Field）

**功能描述**: 星级评分，支持 1-5 或 1-10 星

**数据结构**:
```typescript
// 类型标识
type: 'rating'

// PropertyData（属性元数据）
interface RatingPropertyData {
  maxRating: number;  // 最大星数，默认 5
  allowHalf: boolean; // 是否允许半星
}

// 值类型
type RatingValue = number; // 0 到 maxRating
```

**文件结构**:
```
property-presets/
└── rating/
    ├── index.ts           # 导出
    ├── define.ts          # 类型定义
    ├── cell-renderer.ts   # 单元格渲染
    └── components/
        └── rating-cell.ts # 评分组件
```

**UI 设计**:
- 显示：空心/实心星星图标
- 编辑：点击或拖拽选择星数
- 支持半星（可配置）

---

### 1.2 系统字段（System Fields）

**功能描述**: 自动记录创建/修改信息

**字段类型**:
| 字段 | 类型标识 | 说明 |
|-----|---------|------|
| 创建人 | `created-by` | 记录创建者用户 ID |
| 创建时间 | `created-time` | 记录创建时间戳 |
| 修改人 | `modified-by` | 最后修改者用户 ID |
| 修改时间 | `modified-time` | 最后修改时间戳 |

**数据结构**:
```typescript
// 创建人/修改人
interface UserFieldValue {
  userId: string;
  name: string;
  avatar?: string;
}

// 时间字段
type TimestampValue = number; // Unix timestamp (ms)
```

**特殊处理**:
- 系统字段为只读，不可手动编辑
- 创建时自动填充创建人/时间
- 每次修改自动更新修改人/时间
- 需要与用户系统集成获取当前用户

---

### 1.3 附件字段（Attachment Field）

**功能描述**: 支持上传和管理多种文件类型

**数据结构**:
```typescript
type: 'attachment'

interface AttachmentValue {
  id: string;
  name: string;
  size: number;        // 文件大小（字节）
  type: string;        // MIME 类型
  url: string;         // 文件 URL
  thumbnailUrl?: string; // 缩略图 URL（图片/视频）
  uploadedAt: number;  // 上传时间
  uploadedBy: string;  // 上传者 ID
}

// 单元格值为附件数组
type AttachmentCellValue = AttachmentValue[];
```

**支持的文件类型**:
- 图片：jpg, png, gif, webp, svg
- 文档：pdf, doc, docx, xls, xlsx, ppt, pptx
- 压缩包：zip, rar, 7z
- 其他：txt, csv, json

**UI 功能**:
- 拖拽上传
- 点击上传
- 预览（图片直接预览，其他类型显示图标）
- 下载
- 删除
- 文件大小限制配置

---

### 1.4 URL 链接字段（URL Field）

**功能描述**: 存储和展示 URL 链接

**数据结构**:
```typescript
type: 'url'

interface UrlValue {
  url: string;
  title?: string;  // 自动抓取或手动输入
  favicon?: string; // 网站图标
}
```

**功能**:
- 自动识别 URL 格式
- 可点击跳转（新窗口打开）
- 可选：自动抓取页面标题
- 显示网站 favicon

---

### 1.5 电话字段（Phone Field）

**功能描述**: 存储电话号码，支持拨打

**数据结构**:
```typescript
type: 'phone'

interface PhoneValue {
  number: string;      // 电话号码
  countryCode?: string; // 国家/地区代码
}
```

**功能**:
- 格式验证
- 点击拨打（tel: 协议）
- 国际号码格式化

---

### 1.6 邮箱字段（Email Field）

**功能描述**: 存储邮箱地址，支持发送邮件

**数据结构**:
```typescript
type: 'email'

type EmailValue = string;
```

**功能**:
- 邮箱格式验证
- 点击发送邮件（mailto: 协议）

---

### 2.1 公式字段（Formula Field）

**功能描述**: 基于其他字段计算值

**数据结构**:
```typescript
type: 'formula'

interface FormulaPropertyData {
  expression: string;      // 公式表达式
  resultType: 'text' | 'number' | 'date' | 'boolean';
  format?: FormulaFormat;  // 结果格式化配置
}
```

**支持的函数**:
```
// 数学函数
SUM(field1, field2, ...)
AVERAGE(field1, field2, ...)
MAX(field1, field2, ...)
MIN(field1, field2, ...)
ROUND(number, decimals)
ABS(number)
CEIL(number)
FLOOR(number)

// 文本函数
CONCAT(text1, text2, ...)
LEFT(text, count)
RIGHT(text, count)
MID(text, start, count)
LEN(text)
UPPER(text)
LOWER(text)
TRIM(text)
REPLACE(text, old, new)

// 日期函数
NOW()
TODAY()
YEAR(date)
MONTH(date)
DAY(date)
WEEKDAY(date)
DATEDIF(start, end, unit)
DATEADD(date, count, unit)

// 逻辑函数
IF(condition, trueValue, falseValue)
AND(cond1, cond2, ...)
OR(cond1, cond2, ...)
NOT(condition)
SWITCH(value, case1, result1, ..., default)

// 关联函数（用于 Rollup）
COUNTALL(relation)
COUNTA(relation.field)
SUM(relation.field)
AVERAGE(relation.field)
```

**实现基础**: 利用现有的 `expression/` 系统扩展

---

### 2.2 人员字段（Person Field）

**功能描述**: 选择工作区成员

**数据结构**:
```typescript
type: 'person'

interface PersonPropertyData {
  allowMultiple: boolean;  // 是否允许多选
  notifyOnAssign: boolean; // 分配时是否通知
}

interface PersonValue {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

type PersonCellValue = PersonValue | PersonValue[];
```

**功能**:
- 从工作区成员列表选择
- 支持搜索
- 支持多选（可配置）
- 显示头像和名称
- 可选：分配时发送通知

---

### 2.3 关联字段（Relation Field）

**功能描述**: 关联其他数据表的记录

**数据结构**:
```typescript
type: 'relation'

interface RelationPropertyData {
  targetTableId: string;     // 目标数据表 ID
  targetPropertyId?: string; // 双向关联时的反向属性 ID
  isTwoWay: boolean;         // 是否双向关联
  allowMultiple: boolean;    // 是否允许多个关联
}

interface RelationValue {
  recordId: string;    // 关联记录的 ID
  displayValue: string; // 显示值（主字段值）
}

type RelationCellValue = RelationValue[];
```

**功能**:
- 选择目标表中的记录
- 支持搜索目标记录
- 显示关联记录的主字段值
- 点击可跳转到关联记录
- 双向关联自动同步

---

### 2.4 汇总字段（Rollup Field）

**功能描述**: 汇总关联记录的数据

**数据结构**:
```typescript
type: 'rollup'

interface RollupPropertyData {
  relationPropertyId: string;  // 关联字段 ID
  targetPropertyId: string;    // 目标表中要汇总的字段 ID
  aggregation: RollupAggregation;
  format?: RollupFormat;
}

type RollupAggregation = 
  | 'count'           // 计数
  | 'countValues'     // 非空值计数
  | 'countUnique'     // 唯一值计数
  | 'sum'             // 求和
  | 'average'         // 平均值
  | 'max'             // 最大值
  | 'min'             // 最小值
  | 'range'           // 范围
  | 'concat'          // 连接文本
  | 'arrayUnique'     // 唯一值数组
  | 'percentEmpty'    // 空值百分比
  | 'percentFilled';  // 非空值百分比
```

---

### 2.5 地理位置字段（Location Field）

**功能描述**: 存储地理坐标和地址

**数据结构**:
```typescript
type: 'location'

interface LocationValue {
  latitude: number;
  longitude: number;
  address?: string;       // 格式化地址
  name?: string;          // 地点名称
  country?: string;
  city?: string;
}
```

**功能**:
- 地图选点
- 地址搜索
- 当前位置定位
- 地图预览

---

### 3.1 日期相对筛选

**新增筛选条件**:
```typescript
type DateRelativeFilter = {
  type: 'date-relative';
  operator: 
    | 'today'
    | 'tomorrow'
    | 'yesterday'
    | 'this_week'
    | 'last_week'
    | 'next_week'
    | 'this_month'
    | 'last_month'
    | 'next_month'
    | 'this_year'
    | 'last_year'
    | 'next_year'
    | 'past_days'      // 过去 N 天
    | 'next_days'      // 未来 N 天
    | 'past_weeks'
    | 'next_weeks'
    | 'past_months'
    | 'next_months';
  value?: number;  // 用于 past_days, next_days 等
};
```

---

### 3.2 空值筛选

**新增筛选条件**:
```typescript
type EmptyFilter = {
  type: 'empty';
  operator: 'is_empty' | 'is_not_empty';
};
```

---

### 4.1-4.4 数据导入导出

**CSV 格式**:
- 首行为列标题
- UTF-8 编码
- 支持自定义分隔符

**Excel 格式**:
- 使用 xlsx 库
- 保留格式和样式
- 支持多 sheet（对应多视图）

**导入流程**:
1. 上传文件
2. 解析预览
3. 字段映射（源列 -> 目标属性）
4. 数据类型转换确认
5. 导入执行
6. 结果报告（成功/失败/跳过）

---

### 5.1 单元格评论

**数据结构**:
```typescript
interface CellComment {
  id: string;
  cellId: string;      // `${rowId}:${propertyId}`
  content: string;
  author: UserInfo;
  createdAt: number;
  updatedAt?: number;
  mentions?: string[]; // 被 @ 的用户 ID
  replies?: CellComment[];
}
```

---

### 6.1 自动化规则引擎

**规则结构**:
```typescript
interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  conditions?: FilterGroup;
  actions: Action[];
}

type Trigger = 
  | { type: 'record_created' }
  | { type: 'record_updated'; watchFields?: string[] }
  | { type: 'record_deleted' }
  | { type: 'field_changed'; fieldId: string }
  | { type: 'scheduled'; cron: string };

type Action = 
  | { type: 'update_record'; updates: FieldUpdate[] }
  | { type: 'create_record'; data: Record<string, unknown> }
  | { type: 'delete_record' }
  | { type: 'send_notification'; config: NotificationConfig }
  | { type: 'call_webhook'; config: WebhookConfig }
  | { type: 'send_email'; config: EmailConfig };
```

---

## 三、技术实现指南

### 新增字段类型的标准步骤

1. **创建目录结构**:
```
property-presets/
└── {field-type}/
    ├── index.ts           # 导出入口
    ├── define.ts          # 类型定义和属性配置
    ├── cell-renderer.ts   # 单元格渲染器
    ├── value-renderer.ts  # 值渲染（只读）
    └── components/        # UI 组件
```

2. **定义类型** (`define.ts`):
```typescript
import { propertyType, t } from '../../core/index.js';

export const {field}PropertyType = propertyType('{field-type}', {
  // JSON 值类型（用于存储）
  jsonValueType: () => t.{type}.instance(),
  
  // 原始值类型（用于编辑）
  rawValueType: () => t.{type}.instance(),
  
  // 默认属性数据
  defaultData: () => ({}),
  
  // JSON 值转原始值
  rawToJson: v => v,
  
  // 原始值转 JSON 值
  jsonToRaw: v => v,
  
  // 文本转原始值
  textToRaw: text => text,
  
  // 原始值转文本
  rawToText: v => String(v),
});
```

3. **注册到系统** (`property-presets/index.ts`)

4. **添加到菜单** (`core/property/property-menu.ts`)

---

## 四、开发日志

> 每完成一个功能，在此记录

### 2026-01-28
- [x] 创建开发计划文档
- [x] 完成评分字段（rating）开发
  - `property-presets/rating/` - 支持 1-10 星配置、半星、自定义颜色
- [x] 完成 URL 链接字段（url）开发
  - `property-presets/url/` - 支持点击跳转、自动格式化显示
- [x] 完成电话字段（phone）开发
  - `property-presets/phone/` - 支持 tel: 协议拨打、中国手机号格式化
- [x] 完成邮箱字段（email）开发
  - `property-presets/email/` - 支持 mailto: 协议、邮箱格式验证
- [x] 完成系统字段开发
  - `blocks/database/src/properties/created-time/` - 创建时间（只读）
  - `blocks/database/src/properties/modified-time/` - 修改时间（只读）
  - `blocks/database/src/properties/created-by/` - 创建人（只读，显示头像和名称）
  - `blocks/database/src/properties/modified-by/` - 修改人（只读，显示头像和名称）
- [x] 完成附件字段（attachment）开发
  - `property-presets/attachment/` - 支持多文件上传、缩略图预览、文件大小显示
- [x] 完成公式字段（formula）开发
  - `property-presets/formula/` - 支持字段引用 {字段名}、数学/文本/日期/逻辑函数
  - 内置函数：SUM, AVERAGE, MAX, MIN, CONCAT, IF, NOW, TODAY 等
- [x] 完成人员字段（person）开发
  - `property-presets/person/` - 支持单选/多选成员、头像显示、搜索成员
- [x] 完成关联字段（relation）开发
  - `property-presets/relation/` - 支持单向/双向关联、多选关联、搜索记录
- [x] 完成 CSV/JSON 导出功能
  - `widget-presets/tools/presets/export/` - 支持 CSV 和 JSON 格式导出
  - 已集成到视图设置菜单中
- [x] 完成汇总字段（rollup）开发
  - `property-presets/rollup/` - 支持 14 种汇总函数
  - 函数：计数、求和、平均值、最大/最小、中位数、日期汇总等
- [x] 完成地理位置字段（location）开发
  - `property-presets/location/` - 支持坐标输入、地图链接、获取当前位置
- [x] 完成 CSV 导入功能
  - `widget-presets/tools/presets/import/` - 支持 CSV 文件解析和数据导入
  - 自动匹配列名与字段名、支持多种数据类型转换
- [x] 完成日期相对筛选功能
  - `core/filter/filter-fn/date.ts` - 新增 7 种日期筛选条件
  - 今天、本周、本月、过去N天、未来N天、超过N天前
- [x] 确认空值/非空值筛选已存在（core/filter/filter-fn/unknown.ts）
- [x] 完成视图模板功能
  - `widget-presets/tools/presets/view-template/` - 模板管理器和预设模板
  - 支持保存视图为模板、应用模板创建新视图
  - 预设模板：任务看板、项目追踪、客户管理、日程安排、库存管理
- [ ] 继续开发其他功能

---

## 五、测试清单

### 字段类型测试
- [ ] 创建字段
- [ ] 编辑单元格值
- [ ] 筛选
- [ ] 排序
- [ ] 分组
- [ ] 导入/导出

### 视图测试
- [ ] 表格视图中的显示
- [ ] 看板视图中的显示
- [ ] 日历视图中的显示
- [ ] 甘特图中的显示

### 协作测试
- [ ] 多人同时编辑
- [ ] 数据同步
- [ ] 冲突处理

---

## 六、参考资料

- [飞书多维表格官方文档](https://www.feishu.cn/hc/zh-CN/categories-detail?category-id=7056534879687852068)
- [Notion Database 功能](https://www.notion.so/help/databases)
- [Airtable Field Types](https://support.airtable.com/docs/supported-field-types-in-airtable-overview)
- [BlockSuite 文档](https://blocksuite.io/)
