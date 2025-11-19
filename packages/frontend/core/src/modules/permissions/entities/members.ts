// 本地定义的 Member 类型，替代 GraphQL
import {
  catchErrorInto,
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
  smartRetry,
} from '@toeverything/infra';
import { map, switchMap, tap } from 'rxjs';

import type { WorkspaceService } from '../../workspace';
import type { WorkspaceMembersStore } from '../stores/members';

export type Member = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  status?: string;
  // 权限（Owner/Admin/Collaborator），用于显示角色文案
  permission?: string;
};

const normalizeStatus = (status?: string): string | undefined => {
  if (!status) {
    return 'ACCEPTED';
  }
  const upper = status.toUpperCase();
  return upper;
};

const mapRoleToPermission = (role?: string): string | undefined => {
  if (!role) return undefined;
  const upper = role.toUpperCase();
  switch (upper) {
    case 'OWNER':
      return 'Owner';
    case 'ADMIN':
      return 'Admin';
    case 'MEMBER':
    case 'COLLABORATOR':
      return 'Collaborator';
    default:
      return undefined;
  }
};

export class WorkspaceMembers extends Entity {
  constructor(
    private readonly store: WorkspaceMembersStore,
    private readonly workspaceService: WorkspaceService
  ) {
    super();
  }

  pageNum$ = new LiveData(0);
  memberCount$ = new LiveData<number | undefined>(undefined);
  pageMembers$ = new LiveData<Member[] | undefined>(undefined);

  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  readonly PAGE_SIZE = 8;

  readonly revalidate = effect(
    map(() => this.pageNum$.value),
    switchMap(pageNum => {
      return fromPromise(async signal => {
        return this.store.fetchMembers(
          this.workspaceService.workspace.id,
          pageNum * this.PAGE_SIZE,
          this.PAGE_SIZE,
          signal
        );
      }).pipe(
        tap(data => {
          this.memberCount$.setValue(data.memberCount);

          const members: Member[] = (data.members ?? []).map((raw: any) => {
            const id = raw.userId ?? raw.id;
            const email: string | undefined = raw.email;
            const name: string =
              raw.name || email || id || '';

            return {
              id,
              name,
              email,
              avatarUrl: raw.avatarUrl ?? null,
              status: normalizeStatus(raw.status),
              permission: mapRoleToPermission(raw.role),
            };
          });

          this.pageMembers$.setValue(members);
        }),
        smartRetry(),
        catchErrorInto(this.error$),
        onStart(() => {
          this.pageMembers$.setValue(undefined);
          this.isLoading$.setValue(true);
        }),
        onComplete(() => this.isLoading$.setValue(false))
      );
    })
  );

  setPageNum(pageNum: number) {
    this.pageNum$.setValue(pageNum);
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
