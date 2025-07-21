import { DebugLogger } from '@affine/debug';
import {
  effect,
  exhaustMapWithTrailing,
  fromPromise,
  Service,
} from '@toeverything/infra';
import { catchError, distinctUntilChanged, EMPTY, throttleTime } from 'rxjs';

import type { AIButtonProvider } from '../provider/ai-button';

const logger = new DebugLogger('AIButtonService');

export class AIButtonService extends Service {
  constructor(private readonly aiButtonProvider?: AIButtonProvider) {
    super();
  }

  presentAIButton = effect(
    distinctUntilChanged(),
    throttleTime<boolean>(1000), // 节流时间以避免频繁调用
    exhaustMapWithTrailing((present: boolean) => {
      return fromPromise(async () => {
        if (!this.aiButtonProvider) {
          return;
        }
        if (present) {
          await this.aiButtonProvider.presentAIButton();
        } else {
          await this.aiButtonProvider.dismissAIButton();
        }
        return;
      }).pipe(
        catchError(err => {
          logger.error('呈现AI按钮错误', err);
          return EMPTY;
        })
      );
    })
  );
}
