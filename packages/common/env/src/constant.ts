// 此文件不应有副作用
// This file should has not side effect

declare global {
  // oxlint-disable-next-line no-var
  var __appInfo: {
    electron: boolean;
    scheme: string;
    windowName: string;
  };
}

export const DEFAULT_WORKSPACE_NAME = '演示工作区';
export const UNTITLED_WORKSPACE_NAME = '未命名';

export const DEFAULT_SORT_KEY = 'updatedDate';
export const MessageCode = {
  loginError: 0,
  noPermission: 1,
  loadListFailed: 2,
  getDetailFailed: 3,
  createWorkspaceFailed: 4,
  getMembersFailed: 5,
  updateWorkspaceFailed: 6,
  deleteWorkspaceFailed: 7,
  inviteMemberFailed: 8,
  removeMemberFailed: 9,
  acceptInvitingFailed: 10,
  getBlobFailed: 11,
  leaveWorkspaceFailed: 12,
  downloadWorkspaceFailed: 13,
  refreshTokenError: 14,
  blobTooLarge: 15,
} as const;

export const Messages = {
  [MessageCode.loginError]: {
    message: '登录失败',
  },
  [MessageCode.noPermission]: {
    message: '没有权限',
  },
  [MessageCode.loadListFailed]: {
    message: '加载列表失败',
  },
  [MessageCode.getDetailFailed]: {
    message: '获取详情失败',
  },
  [MessageCode.createWorkspaceFailed]: {
    message: '创建工作区失败',
  },
  [MessageCode.getMembersFailed]: {
    message: '获取成员失败',
  },
  [MessageCode.updateWorkspaceFailed]: {
    message: '更新工作区失败',
  },
  [MessageCode.deleteWorkspaceFailed]: {
    message: '删除工作区失败',
  },
  [MessageCode.inviteMemberFailed]: {
    message: '邀请成员失败',
  },
  [MessageCode.removeMemberFailed]: {
    message: '移除成员失败',
  },
  [MessageCode.acceptInvitingFailed]: {
    message: '接受邀请失败',
  },
  [MessageCode.getBlobFailed]: {
    message: '获取二进制数据失败',
  },
  [MessageCode.leaveWorkspaceFailed]: {
    message: '离开工作区失败',
  },
  [MessageCode.downloadWorkspaceFailed]: {
    message: '下载工作区失败',
  },
  [MessageCode.refreshTokenError]: {
    message: '刷新令牌失败',
  },
  [MessageCode.blobTooLarge]: {
    message: '二进制数据过大',
  },
} as const satisfies {
  [key in (typeof MessageCode)[keyof typeof MessageCode]]: {
    message: string;
  };
};

export class WorkspaceNotFoundError extends TypeError {
  readonly workspaceId: string;

  constructor(workspaceId: string) {
    super();
    this.workspaceId = workspaceId;
  }
}

export class QueryParamError extends TypeError {
  readonly targetKey: string;
  readonly query: unknown;

  constructor(targetKey: string, query: unknown) {
    super();
    this.targetKey = targetKey;
    this.query = query;
  }
}

export class Unreachable extends Error {
  constructor(message?: string) {
    super(message);
  }
}
