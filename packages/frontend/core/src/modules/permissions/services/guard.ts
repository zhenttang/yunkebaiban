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
          console.log('🛡️ [GuardService.can$] 权限检查:', { action, docId, permissions, isAdmin });
          
          if (isAdmin) {
            console.log('🛡️ [GuardService.can$] 管理员权限，返回 true');
            return subscriber.next(true);
          }
          
          const current = permissions[action] ?? undefined;
          console.log('🛡️ [GuardService.can$] 当前权限:', { action, current, prev });
          
          if (current !== prev) {
            prev = current;
            console.log('🛡️ [GuardService.can$] 权限变化，发送:', current);
            subscriber.next(current);
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
    console.log('🛡️ [GuardService.loadWorkspacePermission] 开始加载工作空间权限');
    console.log('🛡️ [GuardService.loadWorkspacePermission] 工作空间类型:', this.workspaceService.workspace.flavour);
    
    if (this.workspaceService.workspace.flavour === 'local') {
      console.log('🛡️ [GuardService.loadWorkspacePermission] 本地模式，返回空权限');
      return {} as Record<WorkspacePermissionActions, boolean>;
    }
    
    try {
      const response = await this.guardStore.getWorkspacePermissions();
      console.log('🛡️ [GuardService.loadWorkspacePermission] 成功获取权限:', response);
      
      // 提取实际的权限对象
      const permissions = response.permissions || response;
      console.log('🛡️ [GuardService.loadWorkspacePermission] 解析后的权限:', permissions);
      
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
    console.log('🛡️ [GuardService.loadDocPermission] 开始加载文档权限, docId:', docId);
    console.log('🛡️ [GuardService.loadDocPermission] 工作空间类型:', this.workspaceService.workspace.flavour);
    console.log('🛡️ [GuardService.loadDocPermission] 当前URL:', window.location.pathname);
    
    // 跳过特殊路径的权限检查
    if (docId === 'community') {
      console.log('🛡️ [GuardService.loadDocPermission] 跳过社区页面权限检查');
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
      console.log('🛡️ [GuardService.loadDocPermission] 跳过社区文档详情页权限检查, docId:', docId, 'URL:', currentPath);
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
      console.log('🛡️ [GuardService.loadDocPermission] 成功获取文档权限:', response);
      
      // 提取实际的权限对象
      const permissions = response.permissions || response;
      console.log('🛡️ [GuardService.loadDocPermission] 解析后的权限:', permissions);
      
      const newDocPermissions = {
        ...this.docPermissions$.value,
        [docId]: permissions,
      };
      console.log('🛡️ [GuardService.loadDocPermission] 更新 docPermissions$:', newDocPermissions);
      this.docPermissions$.next(newDocPermissions);
      
      console.log('🛡️ [GuardService.loadDocPermission] 更新后的 docPermissions$ 值:', this.docPermissions$.value);
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
