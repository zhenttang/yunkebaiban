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

// ----------------------------------------------
// Bitmask-based permission model (Scheme B)
// ----------------------------------------------

// Each bit represents a granular capability on a document.
// This model co-exists with legacy boolean permission maps and roles.
export enum DocPermission {
  Read = 1 << 0, // 查看/读取
  Comment = 1 << 1, // 评论/批注
  Add = 1 << 2, // 新增（不修改已有内容）
  Modify = 1 << 3, // 修改已有内容
  Delete = 1 << 4, // 删除
  Export = 1 << 5, // 导出/打印
  Share = 1 << 6, // 分享/生成链接
  Invite = 1 << 7, // 邀请协作者
  Manage = 1 << 8, // 成员/权限管理
}

export type PermissionMask = number;

export const hasPermission = (mask: PermissionMask, permission: DocPermission) =>
  (mask & permission) === permission;

// Common presets for quick mapping from roles to capabilities
export const RolePresetsMask = {
  owner:
    (1 << 9) - 1, // all bits enabled (0..8)
  manager:
    DocPermission.Read |
    DocPermission.Comment |
    DocPermission.Add |
    DocPermission.Modify |
    DocPermission.Delete |
    DocPermission.Export |
    DocPermission.Share |
    DocPermission.Invite |
    DocPermission.Manage,
  editor:
    DocPermission.Read |
    DocPermission.Comment |
    DocPermission.Add |
    DocPermission.Modify |
    DocPermission.Export,
  commenter: DocPermission.Read | DocPermission.Comment,
  reader: DocPermission.Read,
  appendOnly: DocPermission.Read | DocPermission.Add,
} as const;

// Convert a bitmask to the legacy boolean map used by guard.ts and UI.
// This preserves backward compatibility while allowing servers to return a mask.
export function maskToDocPermissionMap(mask: PermissionMask): Record<string, boolean> {
  const canRead = hasPermission(mask, DocPermission.Read);
  const canComment = hasPermission(mask, DocPermission.Comment);
  const canAdd = hasPermission(mask, DocPermission.Add);
  const canModify = hasPermission(mask, DocPermission.Modify);
  const canDelete = hasPermission(mask, DocPermission.Delete);

  return {
    // legacy keys consumed by Guard/clients
    'Doc_Read': canRead,
    'Doc_Comment': canComment,
    'Doc_Create': canAdd,
    'Doc_Update': canModify,
    'Doc_Delete': canDelete,
    // "Doc_Write" is a coarse-grained flag; we consider write if user can add or modify
    'Doc_Write': canAdd || canModify,
  } as Record<string, boolean>;
}
