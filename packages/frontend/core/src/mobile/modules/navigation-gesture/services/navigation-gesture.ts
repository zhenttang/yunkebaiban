import { DebugLogger } from '@yunke/debug';
import {
  effect,
  exhaustMapWithTrailing,
  fromPromise,
  LiveData,
  Service,
} from '@toeverything/infra';
import { catchError, distinctUntilChanged, EMPTY } from 'rxjs';

import type { NavigationGestureProvider } from '../providers/navigation-gesture';

const logger = new DebugLogger('yunke:navigation-gesture');

export class NavigationGestureService extends Service {
  public enabled$ = new LiveData(false);

  constructor(
    private readonly navigationGestureProvider?: NavigationGestureProvider
  ) {
    super();
  }

  setEnabled = effect(
    distinctUntilChanged<boolean>(),
    exhaustMapWithTrailing((enable: boolean) => {
      return fromPromise(async () => {
        if (!this.navigationGestureProvider) {
          return;
        }
        if (enable) {
          await this.enable();
        } else {
          await this.disable();
        }
        return;
      }).pipe(
        catchError(err => {
          logger.error('导航手势提供者错误', err);
          return EMPTY;
        })
      );
    })
  );

  async enable() {
    this.enabled$.next(true);
    logger.debug(`启用导航手势`);
    return this.navigationGestureProvider?.enable();
  }

  async disable() {
    this.enabled$.next(false);
    logger.debug(`禁用导航手势`);
    return this.navigationGestureProvider?.disable();
  }
}
