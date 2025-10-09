// Local types to replace removed GraphQL enums and result shapes

// 分享公开模式：
// - 'page'       表示公开只读
// - 'append-only'表示公开仅追加
export type PublicDocMode = 'page' | 'append-only';

export interface ShareInfoType {
  public: boolean;
  mode: PublicDocMode;
  // 默认访问角色（用于“工作区中的成员”权限显示）
  // none -> 禁止访问, reader -> 只读, editor -> 可编辑, manager -> 可管理
  defaultRole?: DocRole;
}

// 文档成员角色
export enum DocRole {
  Owner = 'owner',
  Manager = 'manager',
  Editor = 'editor',
  Reader = 'reader',
  None = 'none',
}
