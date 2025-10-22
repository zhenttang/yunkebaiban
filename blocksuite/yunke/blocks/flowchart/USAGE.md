# 🔀 Yunke Flow 图表块 - 使用指南

## 📋 使用步骤

### 1. 创建流程图块

在文档中有两种方式创建流程图块：

#### 方式一：使用斜杠命令
1. 在文档中输入 `/`
2. 选择 "Flowchart" 或 "流程图"
3. 点击创建

#### 方式二：直接点击占位符
1. 滚动到空白区域
2. 点击 "点击创建 Yunke Flow 图表" 占位符

### 2. 编写 DSL 代码

在弹出的编辑器中输入 DSL 代码。

#### 最简单的示例（3步）

```
diagram "我的第一个图表" {
  node A label "开始"
  node B label "结束"
  
  A -> B
}
```

#### 基本语法

1. **定义图表名称**
   ```
   diagram "图表名称" {
     ...
   }
   ```

2. **定义节点**
   ```
   node 节点ID label "节点显示文本"
   ```
   示例：
   ```
   node frontend label "前端应用"
   node backend label "后端服务"
   ```

3. **定义连线**
   ```
   节点A -> 节点B : "连线标签"
   ```
   或不带标签：
   ```
   节点A -> 节点B
   ```
   
   示例：
   ```
   frontend -> backend : "API 调用"
   backend -> database
   ```

4. **定义分组**
   ```
   group 分组ID label "分组名称" {
     node 节点1 label "..."
     node 节点2 label "..."
   }
   ```
   
   引用分组内的节点：
   ```
   外部节点 -> 分组ID.节点1
   ```

### 3. 预览和保存

1. 输入代码后，右侧会**实时预览**图表
2. 点击 "💾 保存" 按钮保存
3. 图表会显示在文档中

## 📝 完整示例

### 示例1: 简单流程

```
diagram "简单流程" {
  node start label "开始"
  node process label "处理数据"
  node end label "结束"
  
  start -> process : "执行"
  process -> end : "完成"
}
```

### 示例2: 微服务架构

```
diagram "微服务架构" {
  node frontend label "前端应用"
  node gateway label "API 网关"
  
  group services label "后端服务" {
    node auth label "认证服务"
    node user label "用户服务"
    node data label "数据服务"
  }
  
  node db label "数据库"
  
  frontend -> gateway : "HTTP"
  gateway -> services.auth : "验证"
  gateway -> services.user : "用户信息"
  gateway -> services.data : "业务数据"
  services.data -> db : "CRUD"
}
```

### 示例3: 数据流

```
diagram "数据处理流程" {
  node source label "数据源"
  
  group etl label "ETL 处理" {
    node extract label "提取"
    node transform label "转换"
    node load label "加载"
  }
  
  node warehouse label "数据仓库"
  
  source -> etl.extract : "读取"
  etl.extract -> etl.transform : "清洗"
  etl.transform -> etl.load : "标准化"
  etl.load -> warehouse : "存储"
}
```

## 🔧 故障排查

### 问题1: 粘贴代码后没有显示图表

**解决方案：**

1. **硬刷新浏览器**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **检查是否有编译错误**
   - 打开浏览器控制台 (F12)
   - 查看是否有红色错误信息
   - 截图发给开发者

3. **测试解析器**
   - 在浏览器中打开：`http://localhost:8081/blocksuite/yunke/blocks/flowchart/test-parser.html`
   - 粘贴您的 DSL 代码
   - 查看是否能渲染

### 问题2: 显示"未找到任何节点定义"

**原因：** DSL 语法错误

**检查项：**
- [ ] 是否有 `diagram "..." { }` 包裹
- [ ] 节点定义格式是否正确：`node ID label "文本"`
- [ ] 引号是否正确（必须是英文引号 `"`，不能是中文引号 `""`）

**正确示例：**
```
diagram "测试" {
  node A label "节点A"
  node B label "节点B"
  A -> B
}
```

**错误示例：**
```
diagram "测试" {
  node A "节点A"          ❌ 缺少 label 关键字
  node B label "节点B"    ❌ 使用了中文引号
}
```

### 问题3: 连线没有显示

**可能原因：**
1. 节点 ID 拼写错误
2. 分组节点引用格式错误

**检查：**
```
// ✅ 正确
node frontend label "前端"
node backend label "后端"
frontend -> backend

// ❌ 错误：节点ID不匹配
node frontEnd label "前端"   
frontend -> backend  // frontEnd != frontend

// ✅ 正确：分组引用
group services label "服务" {
  node auth label "认证"
}
api -> services.auth

// ❌ 错误：忘记加分组前缀
api -> auth  // 应该是 services.auth
```

### 问题4: 图表太小或太大

**调整方法：**

当前布局参数在 `svg-renderer.ts` 中：
- `NODE_WIDTH = 180` - 节点宽度
- `NODE_HEIGHT = 80` - 节点高度
- `H_GAP = 120` - 水平间距
- `V_GAP = 80` - 垂直间距

您可以在浏览器中缩放查看：
- 放大：`Ctrl/Cmd + +`
- 缩小：`Ctrl/Cmd + -`

## 💡 快速开始模板

在编辑器中有"快速开始"下拉菜单，包含以下模板：

1. **简单流程** - 最基础的示例
2. **实时同步架构** - 带分组的复杂示例
3. **微服务架构** - 多层架构示例
4. **CI/CD 流水线** - 线性流程示例
5. **数据处理流程** - ETL 流程示例
6. **用户认证流程** - 详细步骤示例
7. **消息队列系统** - 发布/订阅模式

选择一个模板，然后根据需要修改即可！

## 🎨 语法高亮建议

如果您使用外部编辑器编写 DSL：

- 推荐：VS Code + 自定义语法高亮
- 文件扩展名：`.flow` 或 `.yunkeflow`

## 📞 获取帮助

如果以上方法都无法解决问题：

1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 粘贴代码并尝试渲染
4. 截图完整的错误信息
5. 联系开发者并提供：
   - 错误截图
   - 您的 DSL 代码
   - 浏览器版本

---

**祝您使用愉快！** 🎉

