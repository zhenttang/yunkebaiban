/**
 * Yunke Flow DSL 示例库
 */

export interface DslExample {
  name: string;
  description: string;
  code: string;
}

export const DSL_EXAMPLES: Record<string, DslExample> = {
  simple: {
    name: '简单流程',
    description: '基础的节点和连线示例',
    code: `diagram "简单流程" {
  node start label "开始"
  node process label "处理数据"
  node end label "结束"
  
  start -> process : "执行"
  process -> end : "完成"
}`,
  },

  realtimeSync: {
    name: '实时同步架构',
    description: '白板实时同步拓扑',
    code: `diagram "Realtime Sync" {
  node app type browser label "Editor"
  node worker type worker label "Shared Worker"
  
  group storage label "Storage" {
    node cache type database label "IndexedDB"
    node cloud type service label "Cloud Storage"
  }

  app -> worker : "doc updates"
  worker -> storage.cache : "cache"
  worker -> storage.cloud : "sync"
}`,
  },

  microservice: {
    name: '微服务架构',
    description: '前后端分离的微服务示例',
    code: `diagram "微服务架构" {
  node frontend label "前端应用"
  node gateway label "API 网关"
  
  group services label "后端服务" {
    node auth label "认证服务"
    node user label "用户服务"
    node data label "数据服务"
  }
  
  node cache label "Redis 缓存"
  node db label "MySQL 数据库"
  
  frontend -> gateway : "HTTP"
  gateway -> services.auth : "验证"
  gateway -> services.user : "用户信息"
  gateway -> services.data : "业务数据"
  
  services.auth -> cache : "存储 Token"
  services.user -> db : "查询用户"
  services.data -> db : "CRUD"
}`,
  },

  cicd: {
    name: 'CI/CD 流水线',
    description: '持续集成和部署流程',
    code: `diagram "CI/CD Pipeline" {
  node commit label "代码提交"
  node build label "构建"
  node test label "测试"
  node review label "代码审查"
  node deploy_staging label "部署测试环境"
  node deploy_prod label "部署生产环境"
  node monitor label "监控"
  
  commit -> build : "触发"
  build -> test : "自动"
  test -> review : "通过"
  review -> deploy_staging : "批准"
  deploy_staging -> deploy_prod : "验证通过"
  deploy_prod -> monitor : "上线"
}`,
  },

  dataFlow: {
    name: '数据处理流程',
    description: 'ETL 数据处理流程',
    code: `diagram "数据处理流程" {
  node source label "数据源"
  
  group etl label "ETL 处理" {
    node extract label "提取"
    node transform label "转换"
    node load label "加载"
  }
  
  node warehouse label "数据仓库"
  node bi label "BI 分析"
  
  source -> etl.extract : "读取"
  etl.extract -> etl.transform : "清洗"
  etl.transform -> etl.load : "标准化"
  etl.load -> warehouse : "存储"
  warehouse -> bi : "可视化"
}`,
  },

  authentication: {
    name: '用户认证流程',
    description: 'OAuth 2.0 认证流程',
    code: `diagram "用户认证流程" {
  node user label "用户"
  node client label "客户端"
  node auth label "认证服务器"
  node resource label "资源服务器"
  
  user -> client : "1. 请求登录"
  client -> auth : "2. 重定向授权"
  auth -> user : "3. 显示登录页"
  user -> auth : "4. 输入凭证"
  auth -> client : "5. 返回授权码"
  client -> auth : "6. 换取 Token"
  auth -> client : "7. 返回 Access Token"
  client -> resource : "8. 携带 Token 访问"
  resource -> client : "9. 返回数据"
}`,
  },

  messagQueue: {
    name: '消息队列系统',
    description: '发布/订阅消息系统',
    code: `diagram "消息队列系统" {
  node publisher1 label "生产者 A"
  node publisher2 label "生产者 B"
  
  node queue label "消息队列"
  
  group consumers label "消费者" {
    node consumer1 label "消费者 1"
    node consumer2 label "消费者 2"
    node consumer3 label "消费者 3"
  }
  
  publisher1 -> queue : "发布消息"
  publisher2 -> queue : "发布消息"
  
  queue -> consumers.consumer1 : "订阅"
  queue -> consumers.consumer2 : "订阅"
  queue -> consumers.consumer3 : "订阅"
}`,
  },
};

