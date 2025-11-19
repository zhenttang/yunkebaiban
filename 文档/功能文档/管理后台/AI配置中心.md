# AI 配置中心（功能 + 实现说明）

> 关联上级：`文档/功能文档/admin.md`  
> 当前实现状态：  
> - 路由 `/admin/ai` 已存在，对应 `packages/frontend/admin/src/modules/ai/index.tsx`；  
> - 当前界面只提供 AI 总开关的占位 UI（启用开关被禁用），提示“目前不支持人工智能功能，自托管 AI 支持正在开发中”；  
> - 模型、Key、配额等配置能力尚待后续版本实现。本节既描述**现有行为**，也规划**未来扩展方向**。

---

## 1. 入口与当前界面结构

### 1.1 路由与模块

- 管理后台中 `/admin/ai` 对应 `AiPage` 组件：

```tsx
function AiPage() {
  const [enableAi, setEnableAi] = useState(false);

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header title="人工智能" />
      <ScrollAreaPrimitive.Root className={cn('relative overflow-hidden w-full')}>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="p-6 max-w-3xl mx-auto">
            <div className="text-[20px]">人工智能</div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[15px] font-medium mt-6">启用人工智能</p>
                <p className="text-sm text-muted-foreground mt-1">
                  目前不支持人工智能功能。自托管AI支持正在开发中。
                </p>
              </div>
              <Switch
                checked={enableAi}
                onCheckedChange={setEnableAi}
                disabled={true}
              />
            </div>
          </div>
          {/* <Prompts /> */}
        </ScrollAreaPrimitive.Viewport>
        {/* 滚动条配置 */}
      </ScrollAreaPrimitive.Root>
    </div>
  );
}

export { AiPage as Component };
```

### 1.2 当前功能说明

- 标题栏 `Header title="人工智能"`：  
  表示当前处于 AI 配置中心页面。
- 主体内容：
  - 标题“人工智能”；
  - 一行“启用人工智能”的标签 + 描述；
  - 右侧一个 `Switch` 开关：
    - `checked={enableAi}` 使用本地状态控制；
    - 但 `disabled={true}`，因此当前 UI 仅作为占位，实际无法启用或关闭 AI。
- 提示文案：
  - “目前不支持人工智能功能。自托管AI支持正在开发中。”  
  表明当前版本中，后端尚未提供 AI 能力配置的接口。

> 结论：目前 `/admin/ai` 页面只是一个**预留界面**，真正的模型、Key、配额配置尚未落地。

---

## 2. 设计目标：模型与供应商配置

> 以下为规划设计，便于后续前后端实现时有统一依据。

### 2.1 模型与供应商选择

目标功能：

- 允许管理员选择可用的大模型供应商，例如：
  - 公有云模型（如 OpenAI、Azure OpenAI、其他云厂商）；
  - 自建模型服务（在自托管环境中部署的推理服务）。
- 在界面上展示：
  - 已配置或可用的模型供应商；
  - 每个供应商下可用的模型列表（如 `gpt-4`, `gpt-3.5-turbo`, 自建模型名称等）。

实现思路（前端）：

- 在 AI 配置中心添加“模型配置”区域：
  - 使用选择器列出供应商；
  - 为每个供应商配置可用模型（勾选或手动输入模型名称）。
- 将配置持久化：
  - 通过管理端 API 发送到后端；
  - 后端负责校验模型名称、连通性等。

### 2.2 工作空间/环境级配置

- 允许管理员针对：
  - 不同工作空间；
  - 不同环境（生产/测试、自托管集群）  
  配置不同的默认模型组合或策略。

> 前端可以通过在配置界面中增加“作用范围”选择器（全局/指定 workspace），并在调用 AI 时附带 workspace 上下文，让后端按配置路由到合适的模型。

---

## 3. Key 与配额管理（规划）

### 3.1 API Key / 凭证配置

目标功能：

- 提供统一界面输入并管理各供应商的访问密钥：
  - API Key；
  - Endpoint；
  - 其他必要凭证（如租户ID、资源名称等）。
- 要求：
  - 密钥在界面上应默认隐藏，只在需要时可临时显示；
  - 修改后应立即生效；
  - 支持多 Key 管理与轮换（视后端实现）。

UI 设计（前端）：

- “凭证管理”区域：
  - 每个供应商一个卡片；
  - 字段包括 Key、Endpoint 等；
  - 提供“测试连接”按钮，调用后端接口验证可用性。

### 3.2 调用配额与用量策略

目标功能：

- 为 AI 能力设置调用配额与用量提醒：
  - 全局调用次数/Token 限额；
  - 单用户/单 workspace 限额；
  - 超限后的行为（禁止调用或降级处理）。
- 展示：
  - 当前用量统计（例如今天/本月调用次数）；
  - 接近限额时的提示。

前端实现建议：

- 与 `WorkspaceQuotaService` 类似的“AI 用量”服务模块；
- 在 AI 配置中心中，显示当前用量概览和配额设置表单；
- 在实际调用 AI 的前端代码中，结合后端返回的限额信息控制 UI 和提示。

---

## 4. 开关与策略（现状 + 规划）

### 4.1 全局启用/禁用开关（现状）

- 当前 `AiPage` 中已经存在一个“启用人工智能”开关，但被禁用：

```tsx
<Switch
  checked={enableAi}
  onCheckedChange={setEnableAi}
  disabled={true} // 当前版本禁用
/>
```

- 将来实现方向：
  - 去掉 `disabled`，并将 `enableAi` 状态与后端配置绑定；
  - 当关闭时：
    - 前端 UI 隐藏或禁用所有 AI 入口（编辑器中的 AI 按钮、侧边面板等）；
    - 后端拒绝 AI 请求或返回明确的“AI 未启用”提示。

### 4.2 功能级开关

为了更细粒度控制，可设计多个功能级开关，例如：

- 文本编辑辅助：
  - 控制是否允许在编辑器中使用“重写/总结/续写”等功能；
- 白板 Copilot：
  - 控制 Edgeless Copilot 入口是否可用；
- Slides 生成：
  - 控制基于文档生成 Slides/结构化结果的功能；
- 语音转写：
  - 控制语音转文字功能是否开启。

前端表现：

- 在 AI 配置中心中以开关列表形式展示；
- 配置变更后，通过配置服务下发到前端模块（`AI功能`相关 view-extensions）；
- 相关组件在渲染时检查开关状态决定是否显示入口。

---

## 5. 与工作空间权限和套餐的关系（概念）

### 5.1 权限控制

- 某些 AI 能力只对特定角色开放：
  - 例如仅 workspace Owner/Admin 可以配置 AI；
  - 普通成员只能使用、不能修改配置。
- 前端应结合权限模块（`WorkspacePermissionService` + `GuardService`）：
  - 在 `/admin/ai` 中限制非管理员访问；
  - 在工作空间内根据权限控制 AI 功能入口显示。

### 5.2 套餐与配额结合

- AI 配额和能力通常受套餐（plan）限制：
  - Free 工作空间：限制每日调用次数/禁用某些高级功能；
  - Pro/Enterprise：开放更多模型与更高配额。
- 前端可以复用配额与 plan 提示模式：
  - 与 `page-history-modal` 中的 PlanPrompt 类似；
  - 在 AI 配置中心显示当前计划，并提供“升级”入口。

> 当前版本的 `/admin/ai` 页面只是一个启用开关占位和文案提示，真正的模型与 Key、配额管理、功能开关等内容可以按本节设计逐步实现。前端结构已经预留了入口，后续主要工作是打通后端 API 与状态管理。 
