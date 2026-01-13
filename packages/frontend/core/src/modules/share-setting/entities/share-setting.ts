import { DebugLogger } from '@yunke/debug';
// 本地定义配置类型，替代 GraphQL 类型
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
import { exhaustMap, tap } from 'rxjs';

import type { WorkspaceService } from '../../workspace';
import type { WorkspaceShareSettingStore } from '../stores/share-setting';

type EnableAi = boolean;
type EnableUrlPreview = boolean;

type InviteLink = {
  link: string;
  // 统一使用 expireTime，内部可由后端的 expiresAt 映射而来
  expireTime?: string;
};

const logger = new DebugLogger('yunke:workspace-permission');

export class WorkspaceShareSetting extends Entity {
  enableAi$ = new LiveData<EnableAi | null>(null);
  enableUrlPreview$ = new LiveData<EnableUrlPreview | null>(null);
  inviteLink$ = new LiveData<InviteLink | null>(null);
  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly store: WorkspaceShareSettingStore
  ) {
    super();
    this.revalidate();
  }

  revalidate = effect(
    exhaustMap(() => {
      return fromPromise(signal =>
        this.store.fetchWorkspaceConfig(
          this.workspaceService.workspace.id,
          signal
        )
      ).pipe(
        smartRetry(),
        tap(value => {
          if (value) {
            // 后端返回 workspace 对象，包含 enableAi、enableUrlPreview、inviteLink 等字段
            this.enableAi$.next(value.enableAi ?? null);
            this.enableUrlPreview$.next(value.enableUrlPreview ?? null);

            const rawInvite = (value as any).inviteLink;
            if (rawInvite && rawInvite.link) {
              const expireTime: string | undefined =
                rawInvite.expireTime || rawInvite.expiresAt || undefined;
              this.inviteLink$.next({
                link: rawInvite.link,
                expireTime,
              });
            } else {
              this.inviteLink$.next(null);
            }
          }
        }),
        catchErrorInto(this.error$, error => {
          logger.error('获取enableUrlPreview失败', error);
        }),
        onStart(() => this.isLoading$.setValue(true)),
        onComplete(() => this.isLoading$.setValue(false))
      );
    })
  );

  async waitForRevalidation(signal?: AbortSignal) {
    this.revalidate();
    await this.isLoading$.waitFor(isLoading => !isLoading, signal);
  }

  async setEnableUrlPreview(enableUrlPreview: EnableUrlPreview) {
    await this.store.updateWorkspaceEnableUrlPreview(
      this.workspaceService.workspace.id,
      enableUrlPreview
    );
    await this.waitForRevalidation();
  }

  async setEnableAi(enableAi: EnableAi) {
    await this.store.updateWorkspaceEnableAi(
      this.workspaceService.workspace.id,
      enableAi
    );
    await this.waitForRevalidation();
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
