# YUNKE → Yunke 重命名工作说明

## 背景与目标
- 将仓库内所有与 YUNKE 相关的命令、命名空间、品牌素材逐步替换为 Yunke。
- 确保命名调整后构建、发布、移动端打包以及周边工具链均能正常运行。
- 在重命名前，通过该文档统一协作准则与执行顺序，降低冲突与回滚成本。

## 命名覆盖范围
1. **JavaScript/TypeScript 生态**
   - 包名 Scope：`@yunke/*`、`@yunke-tools/*`、`@blocksuite/yunke*`。
   - CLI 及脚本：命令名称、帮助信息、环境变量、生成文件默认前缀。
   - 构建产物：Webpack/Vite banner、HTML 模板、错误页资源、CDN 链接。
   - 配置文件：`tsconfig.*`、`*.d.ts` 类型声明、ESLint/Prettier/CI 配置中的别名和注释。
2. **资源与文案**
   - README、用户文档、国际化词条及自适应文案。
   - 品牌域名：`yunke.pro`、`app.yunke.pro` 等外链及 API host。
   - 静态资源：LOGO、图片文件名、CSS 变量、颜色方案前缀。
3. **原生能力与移动端**
   - Android：`applicationId`、Kotlin 包路径 `app.yunke.pro.*`、资源命名、Play Store 配置。
   - iOS：Bundle Identifier、Asset Catalog 文件名 (`yunke@png-*`)、Capacitor/Swift 模块。
   - Uniffi/Rust Bridge：`uniffi.yunke_mobile_native.*` 命名空间。
4. **服务端 & 基础设施**
   - Docker 模板、证书命名、CI/CD 脚本 (`.docker`, GitHub Actions, PlayStore 自动化)。
   - 安装脚本、环境变量、监控告警（如 Sentry 项目名）。

## 执行顺序建议
1. **准备阶段**
   - 确认新域名、CDN、Sentry、Bundle ID、包名等资源已备案/注册。
   - 在当前主分支创建工作分支，冻结与命名相关的合并窗口。
   - 运行 `yarn install && yarn yunke init`，确保基线一致。
2. **核心代码库调整**
   - 批量替换 JS/TS 包名与 import 路径（可先调整 `package.json` 与 `tsconfig` 的引用）。
   - 更新 CLI（命令、帮助、脚本）与工具包，重新生成 `workspace.gen.ts`。
   - 修改构建产物模板与静态资源引用，更新入口 HTML/SVG/错误页。
   - 同步更新 lint/test 配置，确保守卫脚本指向新命令。
3. **资源与文案同步**
   - 批量替换文档、i18n 词条、CSS 变量、图片文件名。
   - 核对 CDN/外链是否对应新的域名或短链服务。
4. **移动端专项**
   - Android：调整包名、`applicationId`、Gradle 配置、Firebase/Sentry 项目映射。
   - iOS：更新 Bundle ID、Provisioning Profile、Asset 名称、Capacitor 配置。
   - Uniffi：重新生成 Rust FFI 绑定，校对 Swift/Kotlin 侧导入路径。
5. **基础设施调整**
   - 更新 Docker、证书、CI/CD、自动发版脚本、Play Store/Apple Store 元数据。
   - 校对监控和日志系统中的项目名称、Tag 与告警规则。
6. **验证回归**
   - 前端：`yarn yunke build -p @yunke/web`、`yarn test`、`yarn lint`。
   - Electron/移动端：拉起本地调试、执行端到端或冒烟测试。
   - 基础设施：构建 CI pipeline、验证证书生成和部署脚本。
7. **发布与后续**
   - 在 staging 环境验证所有入口与域名均已更新。
   - 准备对外公告、更新商店描述、撰写迁移 changelog。
   - 监控上线后指标，必要时准备回滚方案。

## 角色分工建议
- **前端负责人**：负责包名重命名、CLI/构建链路调整、Web 文案资源替换。
- **移动端负责人**：维护 Android/iOS 工程改名及 store 配置、Native Bridge 更新。
- **基础设施负责人**：处理 CI/CD、证书、域名、监控、自动化脚本调整。
- **产品/运营**：准备新的品牌素材、对外公告、商店文案与审核。

## 风险与缓解
- **依赖链断裂**：逐步修改，使用 `yarn workspaces foreach run test` 验证；必要时分批提交。
- **移动端包名变更导致的安装覆盖问题**：在测试环境准备新包名签名；发布前与旧版本共存测试升级路径。
- **外部服务切换窗口**：提前完成新域名 SSL、Sentry 项目的初始化，并在切换当天同步更新。

## 验收标准
- 所有命名相关文件搜索 `yunke` 时仅返回历史或第三方依赖引用。
- Web/Electron/移动端可正常构建、启动并访问 Yunke 域名与服务。
- CI/CD 流程通过，自动化脚本产出的文件/镜像均使用 Yunke 前缀。
- 文档、发行说明、商店页面对外品牌统一为 Yunke。

## 下一步
- 在新分支中实施上述变更，按模块递交 PR。
- 变更完成后更新此文档状态，并整理复盘记录。
