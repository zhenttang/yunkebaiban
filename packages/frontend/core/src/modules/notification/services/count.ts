import {
  catchErrorInto,
  effect,
  exhaustMapWithTrailing,
  fromPromise,
  LiveData,
  onComplete,
  OnEvent,
  onStart,
  Service,
  smartRetry,
} from '@toeverything/infra';
import { tap } from 'rxjs';

import { AccountChanged, type AuthService } from '../../cloud';
import { ServerStarted } from '../../cloud/events/server-started';
import { ApplicationFocused } from '../../lifecycle';
import type { NotificationStore } from '../stores/notification';

@OnEvent(ApplicationFocused, s => s.handleApplicationFocused)
@OnEvent(ServerStarted, s => s.handleServerStarted)
@OnEvent(AccountChanged, s => s.handleAccountChanged)
export class NotificationCountService extends Service {
  constructor(
    private readonly store: NotificationStore,
    private readonly authService: AuthService
  ) {
    super();
  }

  loggedIn$ = this.authService.session.status$.map(v => v === 'authenticated');

  readonly count$ = LiveData.from(this.store.watchNotificationCountCache(), 0);
  readonly isLoading$ = new LiveData(false);
  readonly error$ = new LiveData<any>(null);

  // 仅在特定事件时刷新一次，不再持续轮询
  revalidate = effect(
    exhaustMapWithTrailing(() => {
      return fromPromise(signal => {
        if (!this.loggedIn$.value) {
          return Promise.resolve(0);
        }
        return this.store.getNotificationCount(signal);
      }).pipe(
        tap(result => {
          this.setCount(result ?? 0);
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

  handleApplicationFocused() {
    this.revalidate();
  }

  handleServerStarted() {
    this.revalidate();
  }

  handleAccountChanged() {
    this.revalidate();
  }

  setCount(count: number) {
    this.store.setNotificationCountCache(count);
  }

  override dispose(): void {
    super.dispose();
    this.revalidate.unsubscribe();
  }
}
