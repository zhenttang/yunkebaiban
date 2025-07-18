import {
  catchErrorInto,
  effect,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
  Service,
  smartRetry,
} from '@toeverything/infra';
import { EMPTY, exhaustMap, tap } from 'rxjs';

import type { Notification, NotificationStore, NotificationListResponse } from '../stores/notification';
import type { NotificationCountService } from './count';

export class NotificationListService extends Service {
  isLoading$ = new LiveData(false);
  notifications$ = new LiveData<Notification[]>([]);
  currentPage$ = new LiveData<number>(0);
  totalPages$ = new LiveData<number>(0);
  hasMore$ = new LiveData(true);
  error$ = new LiveData<any>(null);

  readonly PAGE_SIZE = 20;

  constructor(
    private readonly store: NotificationStore,
    private readonly notificationCount: NotificationCountService
  ) {
    super();
  }

  readonly loadMore = effect(
    exhaustMap(() => {
      if (!this.hasMore$.value) {
        return EMPTY;
      }
      return fromPromise(signal =>
        this.store.listNotification(
          {
            page: this.currentPage$.value,
            size: this.PAGE_SIZE,
          },
          signal
        )
      ).pipe(
        tap(result => {
          if (!result) {
            // If the user is not logged in, we just ignore the result.
            return;
          }
          
          const { notifications, totalElements, totalPages, currentPage, hasNext } = result;
          
          // 如果是第一页，替换通知列表；否则追加
          if (currentPage === 0) {
            this.notifications$.next(notifications);
          } else {
            this.notifications$.next([
              ...this.notifications$.value,
              ...notifications,
            ]);
          }

          // 更新分页信息
          this.currentPage$.next(currentPage + 1);
          this.totalPages$.next(totalPages);
          this.hasMore$.next(hasNext);
          
          // 保持通知计数同步
          this.notificationCount.setCount(totalElements);
        }),
        smartRetry(),
        catchErrorInto(this.error$),
        onStart(() => {
          this.isLoading$.setValue(true);
        }),
        onComplete(() => this.isLoading$.setValue(false))
      );
    })
  );

  reset() {
    this.notifications$.setValue([]);
    this.hasMore$.setValue(true);
    this.currentPage$.setValue(0);
    this.totalPages$.setValue(0);
    this.isLoading$.setValue(false);
    this.error$.setValue(null);
    this.loadMore.reset();
  }

  async readNotification(id: string) {
    const success = await this.store.readNotification(id);
    if (success) {
      // 更新本地状态
      const notifications = this.notifications$.value.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
      this.notifications$.next(notifications);
      
      // 更新未读计数
      this.notificationCount.setCount(
        Math.max(this.notificationCount.count$.value - 1, 0)
      );
    }
    return success;
  }

  async deleteNotification(id: string) {
    const success = await this.store.deleteNotification(id);
    if (success) {
      // 从本地列表中移除
      this.notifications$.next(
        this.notifications$.value.filter(notification => notification.id !== id)
      );
    }
    return success;
  }

  async markAllAsRead() {
    const count = await this.store.markAllAsRead();
    if (count > 0) {
      // 更新本地状态
      const notifications = this.notifications$.value.map(notification => 
        ({ ...notification, read: true })
      );
      this.notifications$.next(notifications);
      
      // 重置未读计数
      this.notificationCount.setCount(0);
    }
    return count;
  }

  /**
   * 刷新通知列表
   */
  refresh() {
    this.reset();
    this.loadMore();
  }
}
