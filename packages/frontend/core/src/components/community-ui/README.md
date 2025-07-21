# 社区UI组件库

这是一个为社区功能设计的React UI组件库，包含了文档展示、搜索筛选、用户关注、支付等功能的完整组件。

## 🚀 快速开始

```typescript
import {
  DocumentCard,
  SearchFilter,
  FollowButton,
  PaymentModal,
  TagSelector,
  CategoryFilter,
} from '@affine/core/components/community-ui';
```

## 📦 组件清单

### 1. DocumentCard - 文档卡片组件

展示社区文档的核心组件，支持点赞、收藏、查看等操作。

```typescript
<DocumentCard
  document={document}
  onLike={handleLike}
  onCollect={handleCollect}
  onView={handleView}
/>
```

**特性:**
- 响应式设计，支持移动端
- 支持付费和关注限制的视觉提示
- 可自定义操作按钮
- 内置数字格式化和时间格式化

### 2. SearchFilter - 搜索过滤组件

提供强大的搜索和筛选功能。

```typescript
<SearchFilter
  onSearch={handleSearch}
  categories={categories}
  tags={tags}
  resultCount={100}
/>
```

**特性:**
- 实时搜索建议
- 多条件组合筛选
- 快速筛选按钮
- 可折叠的高级筛选选项

### 3. FollowButton - 关注按钮组件

用户关注功能的核心组件。

```typescript
<FollowButton
  targetUserId="user123"
  isFollowing={false}
  onFollowChange={handleFollowChange}
/>

// 或使用卡片形式
<FollowCard
  user={userInfo}
  isFollowing={false}
  onFollowChange={handleFollowChange}
/>
```

**特性:**
- 支持按钮和卡片两种形式
- 加载状态指示
- 悬停交互效果

### 4. PaymentModal - 支付弹窗组件

处理付费文档解锁的完整支付流程。

```typescript
<PaymentModal
  document={document}
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  onPaymentSuccess={handlePaymentSuccess}
  onCreateOrder={createPaymentOrder}
  onCheckPaymentStatus={checkPaymentStatus}
/>
```

**特性:**
- 支持多种支付方式
- 二维码支付流程
- 实时支付状态检查
- 优雅的状态转换动画

### 5. TagSelector - 标签选择器组件

灵活的标签管理组件。

```typescript
<TagSelector
  selectedTags={selectedTags}
  availableTags={allTags}
  onTagsChange={setSelectedTags}
  onCreateTag={createNewTag}
  maxTags={10}
/>
```

**特性:**
- 支持搜索现有标签
- 可创建新标签
- 自定义标签颜色
- 拖拽排序(可选)

### 6. CategoryFilter - 分类过滤器组件

分类浏览和筛选组件。

```typescript
<CategoryFilter
  categories={categories}
  selectedCategoryId={selectedCategory}
  onCategoryChange={setSelectedCategory}
  view="grid"
/>
```

**特性:**
- 网格、列表、紧凑三种视图
- 分类搜索功能
- 文档数量统计
- 自定义图标支持

## 🎨 样式定制

组件库使用 Vanilla Extract 构建，支持主题定制：

```typescript
import { communityTheme } from '@affine/core/components/community-ui';

// 自定义主题变量
const customTheme = {
  ...communityTheme,
  colors: {
    ...communityTheme.colors,
    primary: '#your-primary-color',
  },
};
```

## 📱 响应式支持

所有组件都内置了响应式设计：

- 移动端优化的触摸交互
- 自适应布局
- 性能优化的渲染

## 🔧 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 测试

```bash
# 运行单元测试
npm run test

# 运行组件测试
npm run test:components
```

### 构建

```bash
# 构建生产版本
npm run build
```

## 📖 API 文档

### DocumentCard Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| document | CommunityDocument | - | 文档数据对象 |
| showActions | boolean | true | 是否显示操作按钮 |
| onLike | (docId: string) => void | - | 点赞回调函数 |
| onCollect | (docId: string) => void | - | 收藏回调函数 |
| onView | (docId: string) => void | - | 查看回调函数 |
| onClick | (docId: string) => void | - | 卡片点击回调 |

### SearchFilter Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| onSearch | (params: SearchParams) => void | - | 搜索回调函数 |
| categories | CategoryInfo[] | - | 分类数据 |
| tags | TagInfo[] | - | 标签数据 |
| loading | boolean | false | 加载状态 |
| resultCount | number | - | 搜索结果数量 |
| defaultParams | Partial<SearchParams> | {} | 默认搜索参数 |

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。