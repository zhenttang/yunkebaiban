import {
  backoffRetry,
  effect,
  exhaustMapWithTrailing,
  fromPromise,
  LiveData,
  Service,
} from '@toeverything/infra';
import {
  combineLatest,
  exhaustMap,
  groupBy,
  map,
  mergeMap,
  Observable,
} from 'rxjs';

import type { WorkspaceService } from '../../workspace';
import type {
  DocPermissionActions,
  GuardStore,
  WorkspacePermissionActions,
} from '../stores/guard';
import type { WorkspacePermissionService } from './permission';

export class GuardService extends Service {
  constructor(
    private readonly guardStore: GuardStore,
    private readonly workspaceService: WorkspaceService,
    private readonly workspacePermissionService: WorkspacePermissionService
  ) {
    super();
  }

  private readonly workspacePermissions$ = new LiveData<
    Partial<Record<WorkspacePermissionActions, boolean>>
  >({});

  private readonly docPermissions$ = new LiveData<
    Record<string, Partial<Record<DocPermissionActions, boolean>>>
  >({});

  private readonly isAdmin$ = LiveData.computed(get => {
    const isOwner = get(this.workspacePermissionService.permission.isOwner$);
    const isAdmin = get(this.workspacePermissionService.permission.isAdmin$);
    if (isOwner === null && isAdmin === null) {
      return null;
    }
    return isOwner || isAdmin;
  });

  /**
   * @example
   * ```ts
   * guardService.can$('Workspace_Properties_Update');
   * guardService.can$('Doc_Update', docId);
   * ```
   *
   * @returns LiveData<boolean | undefined> the value is undefined if the permission is loading
   */
  can$<T extends WorkspacePermissionActions | DocPermissionActions>(
    action: T,
    ...args: T extends DocPermissionActions ? [string] : []
  ): LiveData<boolean | undefined> {
    const docId = args[0];
    return LiveData.from(
      new Observable(subscriber => {
        // 粘性权限：当权限处于“未知/加载中”时，不下发 false/undefined，保持上一次已知值
        let prev: boolean | undefined = undefined;

        const subscription = combineLatest([
          (docId
            ? this.docPermissions$.pipe(
                map(permissions => permissions[docId] ?? {})
              )
            : this.workspacePermissions$.asObservable()) as Observable<
            Record<string, boolean>
          >,
          this.isAdmin$,
        ]).subscribe(([permissions, isAdmin]) => {
          if (isAdmin === true) {
            // 管理员永远允许
            if (prev !== true) {
              prev = true;
              subscriber.next(true);
            }
            return;
          }
          // 当管理员状态未知(null) 或 权限键尚未计算(undefined)时，保持上一次值，避免闪烁为禁用
          const nextVal = (permissions[action] ?? undefined) as boolean | undefined;
          if (nextVal === undefined) {
            // 不推送变化，维持 prev（可能是 true 或 false 或 undefined 初始）
            return;
          }
          if (nextVal !== prev) {
            prev = nextVal;
            subscriber.next(nextVal);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }),
      undefined
    );
  }

  async can<T extends WorkspacePermissionActions | DocPermissionActions>(
    action: T,
    ...args: T extends DocPermissionActions ? [string] : []
  ): Promise<boolean> {
    const docId = args[0];

    if (this.isAdmin$.value === null) {
      await this.workspacePermissionService.permission.waitForRevalidation();
    }

    if (this.isAdmin$.value === true) {
      return true;
    }

    const permissions = await (docId
      ? this.loadDocPermission(docId)
      : this.loadWorkspacePermission());

    return permissions[action as keyof typeof permissions] ?? false;
  }

  revalidateCan<T extends WorkspacePermissionActions | DocPermissionActions>(
    _action: T,
    ...args: T extends DocPermissionActions ? [string] : []
  ) {
    // revalidate workspace permission if it's not initialized
    if (this.isAdmin$.value === null) {
      this.workspacePermissionService.permission.revalidate();
    }

    if (this.isAdmin$.value === true) {
      // if the user is admin, the permission is always true
      return;
    }

    const docId = args[0];
    // revalidate permission
    if (docId) {
      this.revalidateDocPermission(docId);
    } else {
      this.revalidateWorkspacePermission();
    }
  }

  private readonly revalidateWorkspacePermission = effect(
    exhaustMapWithTrailing(() =>
      fromPromise(() => this.guardStore.getWorkspacePermissions()).pipe(
        backoffRetry({
          count: Infinity,
        })
      )
    )
  );

  private readonly revalidateDocPermission = effect(
    groupBy((docId: string) => docId),
    mergeMap(doc$ =>
      doc$.pipe(
        exhaustMap((docId: string) =>
          fromPromise(() => this.loadDocPermission(docId)).pipe(
            backoffRetry({
              count: Infinity,
            })
          )
        )
      )
    )
  );

  private readonly loadWorkspacePermission = async () => {
    if (this.workspaceService.workspace.flavour === 'local') {
      return {} as Record<WorkspacePermissionActions, boolean>;
    }
    
    try {
      const response = await this.guardStore.getWorkspacePermissions();
      
      // 提取实际的权限对象
      const permissions = response.permissions || response;
      
      this.workspacePermissions$.next(permissions);
      return permissions;
    } catch (error) {
      console.error('❌ [GuardService.loadWorkspacePermission] 获取权限失败:', error);
      // 临时解决方案：返回基本权限以避免卡住
      const defaultPermissions = {
        'Workspace_Properties_Update': true,
        'Doc_Read': true,
        'Doc_Write': true,
        'Doc_Delete': true,
        'Doc_Create': true,
        'Doc_Update': true,
      } as Record<WorkspacePermissionActions, boolean>;
      
      console.warn('⚠️ [GuardService.loadWorkspacePermission] 使用默认权限:', defaultPermissions);
      this.workspacePermissions$.next(defaultPermissions);
      return defaultPermissions;
    }
  };

  private readonly loadDocPermission = async (docId: string) => {
    // 跳过特殊路径的权限检查
    if (docId === 'community') {
      const communityPermissions = {
        'Doc_Read': true,
        'Doc_Write': false,
        'Doc_Delete': false,
        'Doc_Update': false,
        'Doc_Create': false,
      } as Record<DocPermissionActions, boolean>;
      
      this.docPermissions$.next({
        ...this.docPermissions$.value,
        [docId]: communityPermissions,
      });
      return communityPermissions;
    }
    
    // 检查是否是社区文档详情页（通过当前URL判断）
    const currentPath = window.location.pathname;
    const isCommunityDetailPage = currentPath.includes('/community/') && docId !== 'community';
    
    // 更宽泛的社区相关页面检查
    const isCommunityRelated = currentPath.includes('/community');
    
    if (isCommunityDetailPage || (isCommunityRelated && docId.match(/^[0-9]+$/))) {
      const communityDocPermissions = {
        'Doc_Read': true,
        'Doc_Write': false,
        'Doc_Delete': false,
        'Doc_Update': false,
        'Doc_Create': false,
      } as Record<DocPermissionActions, boolean>;
      
      this.docPermissions$.next({
        ...this.docPermissions$.value,
        [docId]: communityDocPermissions,
      });
      return communityDocPermissions;
    }
    
    if (this.workspaceService.workspace.flavour === 'local') {
      console.log('🛡️ [GuardService.loadDocPermission] 本地模式，返回空权限');
      return {} as Record<DocPermissionActions, boolean>;
    }
    
    try {
      const response = await this.guardStore.getDocPermissions(docId);
      
      // 提取实际的权限对象
      const permissions = response.permissions || response;
      
      const newDocPermissions = {
        ...this.docPermissions$.value,
        [docId]: permissions,
      };
      this.docPermissions$.next(newDocPermissions);
      return permissions;
    } catch (error) {
      console.error('❌ [GuardService.loadDocPermission] 获取文档权限失败:', error);
      
      // 如果是社区相关错误，给予读取权限
      if (currentPath.includes('/community')) {
        console.log('🛡️ [GuardService.loadDocPermission] 社区相关错误，给予读取权限');
        const communityFallbackPermissions = {
          'Doc_Read': true,
          'Doc_Write': false,
          'Doc_Delete': false,
          'Doc_Update': false,
          'Doc_Create': false,
        } as Record<DocPermissionActions, boolean>;
        
        this.docPermissions$.next({
          ...this.docPermissions$.value,
          [docId]: communityFallbackPermissions,
        });
        return communityFallbackPermissions;
      }
      
      // 临时解决方案：返回基本文档权限以避免卡住
      const defaultPermissions = {
        'Doc_Read': true,
        'Doc_Write': true,
        'Doc_Delete': true,
        'Doc_Update': true,
        'Doc_Create': true,
      } as Record<DocPermissionActions, boolean>;
      
      console.warn('⚠️ [GuardService.loadDocPermission] 使用默认文档权限:', defaultPermissions);
      this.docPermissions$.next({
        ...this.docPermissions$.value,
        [docId]: defaultPermissions,
      });
      return defaultPermissions;
    }
  };

  override dispose() {
    this.revalidateWorkspacePermission.unsubscribe();
    this.revalidateDocPermission.unsubscribe();
  }
}
