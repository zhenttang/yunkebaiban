import { z } from 'zod';

export const workbenchViewIconNameSchema = z.enum([
  'trash',
  'allDocs',
  'collection',
  'tag',
  'doc', // 指向模式尚未确定的文档
  'page',
  'edgeless',
  'journal',
  'attachment',
  'pdf',
]);

export const workbenchViewMetaSchema = z.object({
  id: z.string(),
  path: z
    .object({
      pathname: z.string().optional(),
      hash: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
  // 待办：将标题/模块移至缓存状态
  title: z.string().optional(),
  iconName: workbenchViewIconNameSchema.optional(),
});

export const workbenchMetaSchema = z.object({
  id: z.string(),
  activeViewIndex: z.number(),
  pinned: z.boolean().optional(),
  basename: z.string(),
  views: z.array(workbenchViewMetaSchema),
});

export const tabViewsMetaSchema = z.object({
  activeWorkbenchId: z.string().optional(),
  workbenches: z.array(workbenchMetaSchema).default([]),
});

export const TabViewsMetaKey = 'tabViewsMetaSchema';
export type TabViewsMetaSchema = z.infer<typeof tabViewsMetaSchema>;
export type WorkbenchMeta = z.infer<typeof workbenchMetaSchema>;
export type WorkbenchViewMeta = z.infer<typeof workbenchViewMetaSchema>;
export type WorkbenchViewModule = z.infer<typeof workbenchViewIconNameSchema>;

export const SpellCheckStateSchema = z.object({
  enabled: z.boolean().optional(),
});

export const SpellCheckStateKey = 'spellCheckState' as const;
// oxlint-disable-next-line no-redeclare
export type SpellCheckStateSchema = z.infer<typeof SpellCheckStateSchema>;

export const MenubarStateKey = 'menubarState' as const;
export const MenubarStateSchema = z.object({
  enabled: z.boolean().default(true),
});

export type MenubarStateSchema = z.infer<typeof MenubarStateSchema>;

export const MeetingSettingsKey = 'meetingSettings' as const;
export const MeetingSettingsSchema = z.object({
  // 全局会议功能控制
  enabled: z.boolean().default(false),

  // 如果为false（且enabled=false），显示提示页面
  betaDisclaimerAccepted: z.boolean().default(false),

  // 保存录制内容时，在何处创建录制块
  recordingSavingMode: z.enum(['new-doc', 'journal-today']).default('new-doc'),

  // 是否为新会议录制启用摘要生成
  autoTranscriptionSummary: z.boolean().default(true),

  // 是否为新会议录制启用待办事项列表生成
  autoTranscriptionTodo: z.boolean().default(true),

  // 对新会议事件的录制响应
  recordingMode: z.enum(['none', 'prompt', 'auto-start']).default('prompt'),
});

export type MeetingSettingsSchema = z.infer<typeof MeetingSettingsSchema>; 