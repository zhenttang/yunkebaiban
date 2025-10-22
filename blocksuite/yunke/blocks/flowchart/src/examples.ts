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

  // ===== 分层架构图（新系统） =====

  layeredSimple: {
    name: '简单技术栈',
    description: '三层架构示例',
    code: `diagram "简单技术栈" type "layered" {
  layer frontend label "前端层" color "#c8e6c9" {
    node react label "React"
    node vue label "Vue"
    node angular label "Angular"
  }
  
  layer backend label "后端层" color "#ffe0b2" {
    node spring label "Spring"
    node node label "Node.js"
    node django label "Django"
  }
  
  layer database label "数据库层" color "#b3e5fc" {
    node mysql label "MySQL"
    node redis label "Redis"
    node mongo label "MongoDB"
  }
}`,
  },

  layeredComplete: {
    name: '完整技术架构',
    description: '六层架构示例',
    code: `diagram "云知白板技术栈" type "layered" {
  layer presentation label "表现层" color "#c8e6c9" {
    node kotlin label "Kotlin"
    node swift label "Swift"
    node hybird label "Hybird"
    node vue label "Vue"
    node miniprogram label "MiniProgram"
  }
  
  layer dataexchange label "数据交换层" color "#b3c5d7" {
    node http label "HTTP(s)"
    node json label "JSON"
  }
  
  layer servicesupport label "服务支撑层" color "#bbdefb" {
    node nginx label "Nginx"
    node nacos label "Nacos"
    node fegin label "Fegin"
    node sentinel label "Sentinel"
    node jjwt label "JJWT"
  }
  
  layer serviceimpl label "服务实现层" color "#ffe0b2" {
    node spring label "Spring"
    node springcloud label "Spring Cloud"
    node springboot label "Spring Boot"
    node springmvc label "Spring MVC"
    node springcloudalibaba label "Spring Cloud Alibaba"
    node mybatis label "MyBatis Plus"
    node durid label "Durid"
    node rabbitmq label "RabbitMQ"
    node xxljob label "XXL-Job"
    node caffeine label "Caffeine"
  }
  
  layer storage label "存储层" color "#b3e5fc" {
    node mysql label "MySQL"
    node redis label "Redis"
    node mongodb label "MongoDB"
    node efk label "EFK"
    node oss label "OSS"
  }
  
  layer infrastructure label "基础设施层" color "#e0e0e0" {
    node linux label "Linux"
    node tomcat label "Tomcat"
    node jenkins label "Jenkins"
    node maven label "Maven"
    node bitbucket label "BitBucket"
  }
}`,
  },

  // ===== 树状图（新系统） =====

  treeSimple: {
    name: '简单组织结构',
    description: '树形层级结构示例',
    code: `diagram "公司组织架构" type "tree" {
  root "CEO" {
    node "技术部" {
      node "前端团队"
      node "后端团队"
      node "测试团队"
    }
    node "产品部" {
      node "产品经理"
      node "设计师"
    }
    node "运营部"
  }
}`,
  },

  treeMovieSite: {
    name: '电影网站结构',
    description: '网站导航树状结构',
    code: `diagram "电影首页" type "tree" {
  root "电影首页" {
    node "附近影院" {
      node "搜索电影院" {
        node "文字搜索"
        node "语音搜索"
      }
      node "地图" {
        node "附近十家影院"
        node "全部"
        node "可以订座"
        node "团购券验证"
        node "影院详情页" {
          node "电影介绍"
          node "地图"
          node "校园"
          node "农展"
          node "分享"
        }
      }
      node "影院列表"
    }
    
    node "热映电影" {
      node "正在热映20部电影"
      node "影片详情页"
    }
    
    node "附近电影豆瓣" {
      node "一星推荐"
      node "地图标示"
      node "影院列表" {
        node "介绍"
        node "推荐"
        node "分享"
        node "影院详情页" {
          node "国际介绍"
          node "适用分店"
          node "国际详情"
          node "第三方商家"
          node "生活购"
          node "新居咖啡厅"
          node "洗浴好友"
          node "微信朋友圈"
          node "短信"
          node "邮件"
          node "汽车"
        }
      }
    }
  }
}`,
  },

  treeFileSystem: {
    name: '文件系统结构',
    description: '文件目录树形结构',
    code: `diagram "项目目录结构" type "tree" {
  root "yunke-project" {
    node "src" {
      node "components" {
        node "Header.tsx"
        node "Footer.tsx"
        node "Sidebar.tsx"
      }
      node "pages" {
        node "Home.tsx"
        node "About.tsx"
        node "Contact.tsx"
      }
      node "utils" {
        node "helpers.ts"
        node "constants.ts"
      }
      node "App.tsx"
      node "index.tsx"
    }
    node "public" {
      node "index.html"
      node "favicon.ico"
    }
    node "package.json"
    node "tsconfig.json"
    node "README.md"
  }
}`,
  },
};

