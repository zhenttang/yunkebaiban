import type {
  ForumDTO,
  PostDTO,
  ReplyDTO,
  TagDTO,
  AttachmentDTO,
  NotificationDTO,
  DraftDTO,
  UserPointDTO,
  ModeratorDTO,
  ReportDTO,
} from './types';

function iso(hoursAgo = 0) {
  const d = new Date(Date.now() - hoursAgo * 3600_000);
  return d.toISOString();
}

let postSeq = 1000;
let replySeq = 2000;
let draftSeq = 3000;
let attachmentSeq = 4000;
let notificationSeq = 5000;
let reportSeq = 6000;

export const mockDB = {
  currentUserId: 1,
  forums: [] as ForumDTO[],
  posts: [] as PostDTO[],
  replies: [] as ReplyDTO[],
  tags: [] as TagDTO[],
  postTags: new Map<string, number[]>(), // postId -> tagIds
  attachments: [] as AttachmentDTO[],
  notifications: [] as NotificationDTO[],
  drafts: [] as DraftDTO[],
  collections: [] as { userId: number; postId: string; collectedAt: string }[],
  userPoints: [] as UserPointDTO[],
  moderators: [] as ModeratorDTO[],
  reports: [] as ReportDTO[],
};

// Initialize mock data
(() => {
  const forums: ForumDTO[] = [
    {
      id: 1,
      name: '公告与更新',
      slug: 'announcements',
      description: '发布官方公告、版本更新与活动信息',
      icon: '📌',
      banner: '',
      parentId: undefined,
      displayOrder: 1,
      postCount: 0,
      topicCount: 0,
      isActive: true,
      isPrivate: false,
      announcement: '欢迎加入社区！',
      createdAt: iso(72),
      updatedAt: iso(5),
      children: [
        {
          id: 11,
          name: '公告',
          slug: 'notices',
          description: '平台规则、制度与重要通知',
          icon: '📣',
          banner: '',
          parentId: 1,
          displayOrder: 1,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(96),
          updatedAt: iso(24),
          children: [],
        },
        {
          id: 12,
          name: '更新日志',
          slug: 'changelogs',
          description: '版本更新与问题修复说明',
          icon: '📝',
          banner: '',
          parentId: 1,
          displayOrder: 2,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(120),
          updatedAt: iso(7),
          children: [],
        },
      ],
    },
    {
      id: 2,
      name: '技术讨论',
      slug: 'tech',
      description: '前端、后端、数据库与工具链相关话题',
      icon: '🛠️',
      banner: '',
      parentId: undefined,
      displayOrder: 2,
      postCount: 0,
      topicCount: 0,
      isActive: true,
      isPrivate: false,
      announcement: undefined,
      createdAt: iso(400),
      updatedAt: iso(2),
      children: [
        {
          id: 21,
          name: '前端开发',
          slug: 'frontend',
          description: 'React、Vite、样式系统与性能优化',
          icon: '💻',
          banner: '',
          parentId: 2,
          displayOrder: 1,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(500),
          updatedAt: iso(1),
          children: [],
        },
        {
          id: 22,
          name: '后端开发',
          slug: 'backend',
          description: 'Java、微服务、鉴权与稳定性',
          icon: '🧰',
          banner: '',
          parentId: 2,
          displayOrder: 2,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(520),
          updatedAt: iso(9),
          children: [],
        },
        {
          id: 23,
          name: '数据库与缓存',
          slug: 'data',
          description: 'SQL/NoSQL、索引与查询优化',
          icon: '🗄️',
          banner: '',
          parentId: 2,
          displayOrder: 3,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(600),
          updatedAt: iso(10),
          children: [],
        },
      ],
    },
    {
      id: 3,
      name: '社区交流',
      slug: 'community',
      description: '问答、分享与新手报到',
      icon: '💬',
      banner: '',
      parentId: undefined,
      displayOrder: 3,
      postCount: 0,
      topicCount: 0,
      isActive: true,
      isPrivate: false,
      announcement: undefined,
      createdAt: iso(200),
      updatedAt: iso(12),
      children: [
        {
          id: 31,
          name: '问答专区',
          slug: 'qa',
          description: '新手问题与经验分享',
          icon: '❓',
          banner: '',
          parentId: 3,
          displayOrder: 1,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(220),
          updatedAt: iso(6),
          children: [],
        },
        {
          id: 32,
          name: '新手报到',
          slug: 'newbie',
          description: '自我介绍与社区指南',
          icon: '👋',
          banner: '',
          parentId: 3,
          displayOrder: 2,
          postCount: 0,
          topicCount: 0,
          isActive: true,
          isPrivate: false,
          announcement: undefined,
          createdAt: iso(230),
          updatedAt: iso(15),
          children: [],
        },
      ],
    },
  ];

  mockDB.forums = forums;

  const tags: TagDTO[] = [
    { id: 1, name: '公告', slug: 'notice', description: '官方公告', usageCount: 0, createdAt: iso(1000) },
    { id: 2, name: '更新', slug: 'update', description: '版本更新', usageCount: 0, createdAt: iso(900) },
    { id: 3, name: '前端', slug: 'frontend', description: '前端相关', usageCount: 0, createdAt: iso(800) },
    { id: 4, name: '后端', slug: 'backend', description: '后端相关', usageCount: 0, createdAt: iso(800) },
    { id: 5, name: 'React', slug: 'react', description: 'React框架', usageCount: 0, createdAt: iso(750) },
    { id: 6, name: 'TypeScript', slug: 'typescript', description: 'TypeScript编程', usageCount: 0, createdAt: iso(740) },
    { id: 7, name: '性能优化', slug: 'performance', description: '性能优化相关', usageCount: 0, createdAt: iso(730) },
    { id: 8, name: '数据库', slug: 'database', description: '数据库技术', usageCount: 0, createdAt: iso(720) },
    { id: 9, name: '新手', slug: 'newbie', description: '新手问题', usageCount: 0, createdAt: iso(710) },
    { id: 10, name: '教程', slug: 'tutorial', description: '教程分享', usageCount: 0, createdAt: iso(700) },
    { id: 11, name: 'Bug', slug: 'bug', description: 'Bug反馈', usageCount: 0, createdAt: iso(690) },
    { id: 12, name: '设计模式', slug: 'design-pattern', description: '设计模式', usageCount: 0, createdAt: iso(680) },
  ];
  mockDB.tags = tags;

  function newPost(forumId: number, title: string, content: string, authorId = 1, authorName = '示例用户', tagIds: number[] = []): PostDTO {
    const id = `p${postSeq++}`;
    const p: PostDTO = {
      id,
      forumId,
      forumName: '',
      authorId,
      authorName,
      title,
      content,
      status: 'NORMAL',
      isSticky: false,
      isEssence: false,
      isLocked: false,
      isHot: false,
      viewCount: Math.floor(Math.random() * 500),
      replyCount: 0,
      likeCount: 0,
      collectCount: 0,
      hotScore: 0,
      createdAt: iso(Math.floor(Math.random() * 200)),
      updatedAt: iso(Math.floor(Math.random() * 100)),
      lastReplyAt: undefined,
      isLiked: false,
      isCollected: false,
    };
    mockDB.posts.push(p);
    if (tagIds.length) mockDB.postTags.set(id, tagIds);
    return p;
  }

  // Seed posts
  // 前端开发板块
  newPost(21, '使用 CSS 变量升级样式系统', '分享一套系统化的样式变量方案，覆盖暗色/亮色主题切换。\n\n1. 定义全局变量\n2. 按模块划分变量命名\n3. 实现主题切换逻辑\n\n这套方案已在多个项目中验证，可有效提升样式维护性。', 2, '前端老王', [3, 7]);
  newPost(21, 'React 18 并发特性实践', 'React 18 引入了并发渲染机制，本文分享实践经验：\n\n- useTransition 使用场景\n- Suspense 数据加载\n- 自动批处理优化\n\n附带完整示例代码和性能对比数据。', 3, '张小明', [5, 10]);
  newPost(21, 'TypeScript 类型编程技巧', '分享几个实用的 TypeScript 高级类型技巧：\n\n```typescript\ntype DeepReadonly<T> = {\n  readonly [K in keyof T]: DeepReadonly<T[K]>;\n};\n```\n\n让你的类型系统更加健壮！', 4, 'TS专家', [6, 10]);
  newPost(21, 'Vite 构建速度优化实战', '项目启动时间从 30s 降到 3s 的优化历程：\n\n1. 依赖预构建优化\n2. 路由懒加载\n3. 图片资源优化\n\n完整配置代码已开源到 GitHub。', 5, '前端小李', [3, 7]);
  newPost(21, '【求助】useEffect 无限循环问题', '大家好，我遇到一个 useEffect 无限循环的问题，代码如下：\n\n```jsx\nuseEffect(() => {\n  setData([...data, newItem]);\n}, [data]);\n```\n\n应该如何修复？', 6, '新手小白', [5, 9]);

  // 后端开发板块
  newPost(22, 'Spring Boot 性能优化 10 条', '从连接池、缓存、JIT 到 GC 调优的实践总结。\n\n核心要点：\n- HikariCP 连接池配置\n- Redis 缓存策略\n- JVM 参数调优\n- 异步处理优化\n\n包含压测数据和配置模板。', 7, '后端架构师', [4, 7]);
  newPost(22, 'MySQL 索引优化案例分析', '一次将查询时间从 5s 降到 50ms 的优化案例：\n\n原始 SQL:\n```sql\nSELECT * FROM orders WHERE status = 1 AND created_at > "2024-01-01";\n```\n\n优化策略和执行计划对比详解。', 8, '数据库DBA', [4, 8]);
  newPost(22, '微服务架构中的分布式事务', '详解 Seata AT 模式的实现原理和最佳实践：\n\n1. 全局事务管理\n2. 分支事务协调\n3. 回滚机制\n\n附带完整 Demo 项目。', 9, '架构师老张', [4, 12]);
  newPost(22, 'Java 虚拟线程实战（JDK 21）', 'Project Loom 终于来了！虚拟线程带来的性能提升：\n\n- 传统线程池 vs 虚拟线程\n- 适用场景分析\n- 迁移指南\n\n实测 QPS 提升 3 倍！', 10, 'Java专家', [4, 10]);

  // 数据库与缓存板块
  newPost(23, 'Redis 缓存穿透、击穿、雪崩解决方案', '生产环境遇到的三大缓存问题及解决方案：\n\n1. 布隆过滤器防穿透\n2. 互斥锁防击穿\n3. 限流降级防雪崩\n\n附带完整代码实现。', 11, '缓存专家', [8, 10]);
  newPost(23, 'PostgreSQL vs MySQL 性能对比', '在相同业务场景下的详细对比测试：\n\n测试环境：\n- 数据量：1000万\n- 并发：500\n- 场景：OLTP\n\n结果令人意外...', 8, '数据库DBA', [8]);

  // 问答专区
  newPost(31, '【已解决】Git 合并冲突求助', '在合并分支时遇到冲突，不知道如何处理：\n\n```\n<<<<<<< HEAD\nconst a = 1;\n=======\nconst a = 2;\n>>>>>>> feature\n```\n\n应该怎么做？', 12, '菜鸟程序员', [9]);
  newPost(31, 'API 接口设计最佳实践？', '想请教大家 RESTful API 设计的最佳实践：\n\n- URL 命名规范\n- HTTP 状态码使用\n- 分页参数设计\n- 错误信息格式\n\n有没有推荐的规范文档？', 13, '后端新手', [4, 9]);
  newPost(31, '前端状态管理方案选择', '项目中需要选择状态管理方案：\n\n候选：\n1. Redux Toolkit\n2. Zustand\n3. Jotai\n4. Recoil\n\n大家有什么推荐吗？', 14, '前端开发者', [3, 9]);

  // 新手报到
  newPost(32, '大家好，我是新人小王', '刚加入社区，目前在学习 React 和 Node.js，希望能和大家多多交流！\n\n我的技术栈：\n- 前端：React, Vue\n- 后端：Node.js, Express\n- 数据库：MySQL\n\n请多指教！', 15, '新人小王', [9]);
  newPost(32, '转行程序员一年的心路历程', '从传统行业转行做程序员已经一年了，分享一下我的经历：\n\n学习路线：\n1. HTML/CSS/JS 基础\n2. React 框架\n3. 项目实战\n\n目前已找到第一份工作，年薪15w，感谢社区的帮助！', 16, '转行成功者', [9, 10]);

  // 更新日志
  newPost(12, 'v0.21.0 更新日志', '本次更新修复了若干问题，并带来多项新功能：\n\n新功能：\n- 支持暗色主题\n- 新增 Markdown 编辑器\n- 优化搜索性能\n\n修复：\n- 修复登录超时问题\n- 修复图片上传失败\n\n感谢大家的反馈！', 1, '系统管理员', [1, 2]);
  newPost(12, 'v0.20.0 更新日志', '重要更新：\n\n1. 全新的用户界面\n2. 性能优化（加载速度提升50%）\n3. 新增移动端适配\n\n已部署到生产环境。', 1, '系统管理员', [1, 2]);

  // 公告
  newPost(11, '【公告】论坛规则更新', '为了营造更好的社区氛围，现更新论坛规则：\n\n1. 禁止发布广告信息\n2. 禁止人身攻击\n3. 禁止刷屏灌水\n\n违规者将被禁言或封号，请大家遵守规则！', 1, '系统管理员', [1]);

  // 添加一些精华帖和置顶帖
  mockDB.posts[0].isEssence = true;
  mockDB.posts[0].isSticky = true;
  mockDB.posts[0].likeCount = 45;
  mockDB.posts[0].viewCount = 1205;
  
  mockDB.posts[1].isEssence = true;
  mockDB.posts[1].likeCount = 32;
  mockDB.posts[1].viewCount = 856;
  
  mockDB.posts[5].isEssence = true;
  mockDB.posts[5].likeCount = 28;
  mockDB.posts[5].viewCount = 678;

  mockDB.posts[8].isHot = true;
  mockDB.posts[8].likeCount = 56;
  mockDB.posts[8].viewCount = 1532;

  // Simple replies for multiple posts
  const p0 = mockDB.posts[0]; // CSS 变量文章
  mockDB.replies.push(
    { id: replySeq++, postId: p0.id, userId: 4, username: '路人甲', floor: 1, content: '很实用的技巧，感谢分享！我们项目正好需要这个。', likeCount: 5, isBestAnswer: false, createdAt: iso(10) },
    { id: replySeq++, postId: p0.id, userId: 5, username: '路人乙', floor: 2, content: '是否考虑提供一个代码示例仓库？想看看完整实现。', likeCount: 3, isBestAnswer: false, createdAt: iso(6) },
    { id: replySeq++, postId: p0.id, userId: 2, username: '前端老王', floor: 3, content: '@路人乙 已经上传到 GitHub 了，链接在文章末尾。', likeCount: 8, isBestAnswer: true, createdAt: iso(4) },
    { id: replySeq++, postId: p0.id, userId: 17, username: '前端小陈', floor: 4, content: '这个方案我们也在用，非常好！补充一点：可以配合 CSS Modules 使用。', likeCount: 2, isBestAnswer: false, createdAt: iso(2) }
  );
  p0.replyCount = 4;
  p0.lastReplyAt = mockDB.replies[mockDB.replies.length - 1].createdAt;

  const p1 = mockDB.posts[1]; // React 18
  mockDB.replies.push(
    { id: replySeq++, postId: p1.id, userId: 6, username: '新手小白', floor: 1, content: 'useTransition 和 useDeferredValue 有什么区别？', likeCount: 1, isBestAnswer: false, createdAt: iso(8) },
    { id: replySeq++, postId: p1.id, userId: 3, username: '张小明', floor: 2, content: '@新手小白 useTransition 用于标记状态更新，useDeferredValue 用于延迟渲染值。我会单独写一篇文章详细说明。', likeCount: 6, isBestAnswer: true, createdAt: iso(5) }
  );
  p1.replyCount = 2;
  p1.lastReplyAt = mockDB.replies[mockDB.replies.length - 1].createdAt;

  const p4 = mockDB.posts[4]; // useEffect 问题
  mockDB.replies.push(
    { id: replySeq++, postId: p4.id, userId: 18, username: 'React老手', floor: 1, content: '问题在于 data 每次都是新数组，导致依赖变化。应该使用函数式更新：setData(prev => [...prev, newItem])，并移除依赖。', likeCount: 12, isBestAnswer: true, createdAt: iso(3) },
    { id: replySeq++, postId: p4.id, userId: 6, username: '新手小白', floor: 2, content: '@React老手 太感谢了！问题解决了！', likeCount: 1, isBestAnswer: false, createdAt: iso(1) }
  );
  p4.replyCount = 2;
  p4.lastReplyAt = mockDB.replies[mockDB.replies.length - 1].createdAt;

  const p11 = mockDB.posts[11]; // Git 冲突
  mockDB.replies.push(
    { id: replySeq++, postId: p11.id, userId: 19, username: 'Git大师', floor: 1, content: '保留你需要的代码，删除冲突标记即可。如果两个都要，就合并起来。然后 git add . && git commit。', likeCount: 8, isBestAnswer: true, createdAt: iso(7) },
    { id: replySeq++, postId: p11.id, userId: 12, username: '菜鸟程序员', floor: 2, content: '明白了，感谢！已解决。', likeCount: 0, isBestAnswer: false, createdAt: iso(5) }
  );
  p11.replyCount = 2;
  p11.lastReplyAt = mockDB.replies[mockDB.replies.length - 1].createdAt;

  // Notifications
  mockDB.notifications = [
    { id: `n${notificationSeq++}`, type: 'ForumPostReplied', isRead: false, createdAt: iso(0.5), actorId: 6, actorName: '新手小白', forumId: 21, postId: p4.id, title: '你的帖子有了新回复', excerpt: '太感谢了！问题解决了！' },
    { id: `n${notificationSeq++}`, type: 'ForumPostReplied', isRead: false, createdAt: iso(1), actorId: 5, actorName: '路人乙', forumId: p0.forumId, postId: p0.id, title: '你的帖子有了新回复', excerpt: '是否考虑提供一个代码示例仓库？想看看完整实现。' },
    { id: `n${notificationSeq++}`, type: 'ForumReplyLiked', isRead: false, createdAt: iso(2), actorId: 17, actorName: '前端小陈', forumId: 21, postId: p0.id, replyId: 2000, title: '有人点赞了你的回复' },
    { id: `n${notificationSeq++}`, type: 'ForumPostLiked', isRead: true, createdAt: iso(3), actorId: 8, actorName: '数据库DBA', forumId: 22, postId: mockDB.posts[5].id, title: '有人点赞了你的帖子' },
    { id: `n${notificationSeq++}`, type: 'ForumPostLiked', isRead: true, createdAt: iso(5), actorId: 6, actorName: '路人丙', forumId: p0.forumId, postId: p0.id, title: '有人点赞了你的帖子' },
    { id: `n${notificationSeq++}`, type: 'ForumMention', isRead: false, createdAt: iso(6), actorId: 3, actorName: '张小明', forumId: 21, postId: p1.id, title: '有人在回复中提到了你', excerpt: '@新手小白 useTransition 用于标记状态更新...' },
    { id: `n${notificationSeq++}`, type: 'ForumPostReplied', isRead: true, createdAt: iso(8), actorId: 19, actorName: 'Git大师', forumId: 31, postId: p11.id, title: '你的帖子有了新回复', excerpt: '保留你需要的代码，删除冲突标记即可...' },
    { id: `n${notificationSeq++}`, type: 'ForumPostModerated', isRead: true, createdAt: iso(12), actorId: 1, actorName: '系统管理员', forumId: 21, postId: p0.id, title: '你的帖子被设为精华', metadata: { action: 'essence' } },
    { id: `n${notificationSeq++}`, type: 'ForumReplyLiked', isRead: true, createdAt: iso(15), actorId: 12, actorName: '菜鸟程序员', forumId: 31, postId: p11.id, replyId: 2007, title: '有人点赞了你的回复' },
    { id: `n${notificationSeq++}`, type: 'ForumPostReplied', isRead: true, createdAt: iso(20), actorId: 17, actorName: '前端小陈', forumId: 21, postId: p0.id, title: '你的帖子有了新回复', excerpt: '这个方案我们也在用，非常好！' },
  ];

  // Drafts
  mockDB.drafts = [
    { id: `d${draftSeq++}`, forumId: 21, forumName: '前端开发', authorId: 1, authorName: '示例用户', title: '未完成：表单最佳实践', content: '## 表单设计原则\n\n1. 校验规则设计\n2. 错误提示优化\n3. 无障碍支持\n\n待补充具体内容...', createdAt: iso(30), updatedAt: iso(12) },
    { id: `d${draftSeq++}`, forumId: 22, forumName: '后端开发', authorId: 1, authorName: '示例用户', title: 'Docker 容器化部署指南', content: '# Docker 部署\n\n## 准备工作\n\n- 安装 Docker\n- 编写 Dockerfile\n\n未完成...', createdAt: iso(48), updatedAt: iso(24) },
    { id: `d${draftSeq++}`, forumId: 23, forumName: '数据库与缓存', authorId: 1, authorName: '示例用户', title: '', content: 'SELECT * FROM users WHERE...', createdAt: iso(72), updatedAt: iso(72) },
  ];

  // Attachments
  mockDB.attachments = [
    { id: `a${attachmentSeq++}`, postId: mockDB.posts[0].id, fileName: 'css-variables-demo.zip', contentType: 'application/zip', size: 2048576, url: 'https://example.com/files/css-demo.zip', uploaderId: 2, createdAt: iso(15) },
    { id: `a${attachmentSeq++}`, postId: mockDB.posts[1].id, fileName: 'react18-benchmark.png', contentType: 'image/png', size: 524288, url: 'https://example.com/images/benchmark.png', uploaderId: 3, createdAt: iso(14) },
    { id: `a${attachmentSeq++}`, postId: mockDB.posts[6].id, fileName: 'mysql-explain.pdf', contentType: 'application/pdf', size: 1048576, url: 'https://example.com/docs/explain.pdf', uploaderId: 8, createdAt: iso(11) },
  ];

  // Collections
  mockDB.collections = [
    { userId: 1, postId: mockDB.posts[0].id, collectedAt: iso(20) },
    { userId: 1, postId: mockDB.posts[1].id, collectedAt: iso(18) },
    { userId: 1, postId: mockDB.posts[5].id, collectedAt: iso(15) },
    { userId: 1, postId: mockDB.posts[8].id, collectedAt: iso(10) },
    { userId: 1, postId: mockDB.posts[9].id, collectedAt: iso(8) },
  ];

  // User points
  mockDB.userPoints = [
    {
      id: 1,
      userId: 1,
      username: '示例用户',
      totalPoints: 520,
      level: 3,
      postCount: 8,
      replyCount: 15,
      reputation: 85,
      lastSignInDate: iso(0.5),
      continuousSignInDays: 7,
      createdAt: iso(1000),
      updatedAt: iso(1),
    },
    {
      id: 2,
      userId: 2,
      username: '前端老王',
      totalPoints: 1280,
      level: 5,
      postCount: 32,
      replyCount: 78,
      reputation: 220,
      lastSignInDate: iso(1),
      continuousSignInDays: 15,
      createdAt: iso(900),
      updatedAt: iso(1),
    },
    {
      id: 3,
      userId: 3,
      username: '张小明',
      totalPoints: 860,
      level: 4,
      postCount: 21,
      replyCount: 45,
      reputation: 156,
      lastSignInDate: iso(2),
      continuousSignInDays: 5,
      createdAt: iso(850),
      updatedAt: iso(2),
    },
    {
      id: 4,
      userId: 7,
      username: '后端架构师',
      totalPoints: 2150,
      level: 7,
      postCount: 58,
      replyCount: 123,
      reputation: 385,
      lastSignInDate: iso(0.8),
      continuousSignInDays: 30,
      createdAt: iso(1200),
      updatedAt: iso(0.8),
    },
  ];

  // Moderators
  mockDB.moderators = [
    { id: 1, forumId: 21, forumName: '前端开发', userId: 2, username: '前端老王', role: 'CHIEF', permissions: ['STICKY', 'ESSENCE', 'LOCK', 'DELETE', 'EDIT'], appointedAt: iso(500), createdAt: iso(500) },
    { id: 2, forumId: 21, forumName: '前端开发', userId: 3, username: '张小明', role: 'DEPUTY', permissions: ['STICKY', 'ESSENCE', 'LOCK'], appointedAt: iso(400), createdAt: iso(400) },
    { id: 3, forumId: 22, forumName: '后端开发', userId: 7, username: '后端架构师', role: 'CHIEF', permissions: ['STICKY', 'ESSENCE', 'LOCK', 'DELETE', 'EDIT'], appointedAt: iso(450), createdAt: iso(450) },
    { id: 4, forumId: 23, forumName: '数据库与缓存', userId: 8, username: '数据库DBA', role: 'CHIEF', permissions: ['STICKY', 'ESSENCE', 'LOCK', 'DELETE', 'EDIT'], appointedAt: iso(480), createdAt: iso(480) },
    { id: 5, forumId: 31, forumName: '问答专区', userId: 18, username: 'React老手', role: 'DEPUTY', permissions: ['STICKY', 'ESSENCE'], appointedAt: iso(350), createdAt: iso(350) },
  ];

  // Reports
  mockDB.reports = [
    { id: reportSeq++, targetType: 'POST', targetId: mockDB.posts[4].id, reporterId: 20, reporterName: '用户A', reason: '标题党', description: '标题与内容不符', status: 'PENDING', createdAt: iso(5) },
    { id: reportSeq++, targetType: 'POST', targetId: mockDB.posts[10].id, reporterId: 21, reporterName: '用户B', reason: '重复内容', description: '与之前的帖子重复', status: 'PENDING', createdAt: iso(8) },
    { id: reportSeq++, targetType: 'REPLY', targetId: String(mockDB.replies[2].id), reporterId: 22, reporterName: '用户C', reason: '广告', description: '含有广告链接', status: 'PENDING', createdAt: iso(10) },
    { id: reportSeq++, targetType: 'POST', targetId: mockDB.posts[12].id, reporterId: 23, reporterName: '用户D', reason: '低质量内容', description: '内容过于简单', status: 'RESOLVED', handlerId: 2, handlerName: '前端老王', handleNote: '已提醒作者补充内容', handledAt: iso(15), createdAt: iso(18) },
    { id: reportSeq++, targetType: 'REPLY', targetId: String(mockDB.replies[5].id), reporterId: 24, reporterName: '用户E', reason: '不友善', description: '语气不当', status: 'RESOLVED', handlerId: 7, handlerName: '后端架构师', handleNote: '已删除不当言论', handledAt: iso(20), createdAt: iso(22) },
    { id: reportSeq++, targetType: 'USER', targetId: '25', reporterId: 26, reporterName: '用户F', reason: '恶意刷屏', description: '短时间内发布大量无意义内容', status: 'RESOLVED', handlerId: 1, handlerName: '系统管理员', handleNote: '已禁言 3 天', handledAt: iso(25), createdAt: iso(30) },
    { id: reportSeq++, targetType: 'POST', targetId: mockDB.posts[7].id, reporterId: 27, reporterName: '用户G', reason: '技术错误', description: '文章中的技术方案有严重错误', status: 'REJECTED', handlerId: 7, handlerName: '后端架构师', handleNote: '经核实内容无误，仅为不同实现方案', handledAt: iso(35), createdAt: iso(40) },
  ];
})();

export function paginate<T>(items: T[], page = 0, size = 20) {
  const start = page * size;
  const end = start + size;
  const content = items.slice(start, end);
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return { content, totalElements, totalPages, number: page };
}

export function nextPostId() {
  return `p${postSeq++}`;
}

export function nextReplyId() {
  return replySeq++;
}

export function nextDraftId() {
  return `d${draftSeq++}`;
}

export function nextAttachmentId() {
  return `a${attachmentSeq++}`;
}

