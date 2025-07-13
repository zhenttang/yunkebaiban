// manually synced with packages/backend/server/src/data/migrations/utils/prompts.ts
// TODO(@Peng): automate this
export const promptKeys = [
  // text actions
  '与 AFFiNE AI 对话',
  '使用 AFFiNE AI 搜索',
  '总结',
  '生成标题摘要',
  '生成说明文字',
  '总结网页内容',
  '解释此内容',
  '解释此图片',
  '解释此代码',
  '翻译为',
  '写一篇关于此内容的文章',
  '写一条关于此内容的推文',
  '写一首关于此内容的诗',
  '写一篇关于此内容的博客',
  '写大纲',
  '改变语调为',
  '关于此内容的头脑风暴',
  '扩展思维导图',
  '改善文字表达',
  '改善语法',
  '修正拼写',
  '从中找出行动项',
  '检查代码错误',
  '创建标题',
  '使其真实化',
  '用文字使其真实化',
  '使其更长',
  '使其更短',
  '继续写作',
  // image actions
  '生成图片',
  '转换为动漫风格',
  '转换为粘土风格',
  '转换为像素风格',
  '转换为素描风格',
  '转换为贴纸',
  '放大图片',
  '移除背景',
  // workflows
  '工作流:演示',
  '工作流:头脑风暴',
] as const;

export type PromptKey = (typeof promptKeys)[number];
