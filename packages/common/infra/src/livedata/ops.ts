import { UserFriendlyError } from '@yunke/error';
import {
  catchError,
  connect,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  merge,
  mergeMap,
  Observable,
  type ObservableInput,
  type ObservedValueOf,
  of,
  type OperatorFunction,
  pipe,
  retry,
  switchMap,
  throwError,
  timer,
} from 'rxjs';

import { MANUALLY_STOP } from '../utils';
import type { LiveData } from './livedata';

/**
 * 一个将值映射到`LiveData`的操作符。
 */
export function mapInto<T>(l$: LiveData<T>) {
  return pipe(
    mergeMap((value: T) => {
      l$.next(value);
      return EMPTY;
    })
  );
}

/**
 * 一个捕获错误并将其发送到`LiveData`的操作符。
 *
 * 当可观察对象完成时，`LiveData`将被设置为`null`。这对错误状态恢复很有用。
 *
 * @param cb 发生错误时将调用的回调函数。
 */
export function catchErrorInto<Error = any>(
  l$: LiveData<Error | null>,
  cb?: (error: Error) => void
) {
  return pipe(
    onComplete(() => l$.next(null)),
    catchError((error: any) => {
      l$.next(error);
      cb?.(error);
      return EMPTY;
    })
  );
}

/**
 * 一个在可观察对象开始时调用回调函数的操作符。
 */
export function onStart<T>(cb: () => void): OperatorFunction<T, T> {
  return observable$ =>
    new Observable(subscribe => {
      cb();
      return observable$.subscribe(subscribe);
    });
}

/**
 * 一个在可观察对象完成时调用回调函数的操作符。
 */
export function onComplete<T>(cb: () => void): OperatorFunction<T, T> {
  return observable$ =>
    new Observable(subscribe => {
      return observable$.subscribe({
        complete() {
          cb();
          subscribe.complete();
        },
        error(err) {
          subscribe.error(err);
        },
        next(value) {
          subscribe.next(value);
        },
      });
    });
}

/**
 * 将Promise转换为可观察对象。
 *
 * 类似于`from`但支持`AbortSignal`。
 */
export function fromPromise<T>(
  promise: Promise<T> | ((signal: AbortSignal) => Promise<T>)
): Observable<T> {
  return new Observable(subscriber => {
    const abortController = new AbortController();

    const rawPromise =
      promise instanceof Function ? promise(abortController.signal) : promise;

    rawPromise
      .then(value => {
        subscriber.next(value);
        subscriber.complete();
      })
      .catch(error => {
        subscriber.error(error);
      });

    return () => abortController.abort(MANUALLY_STOP);
  });
}

/**
 * 一个在出现错误时重试源可观察对象的操作符。
 *
 * https://en.wikipedia.org/wiki/Exponential_backoff
 */
export function backoffRetry<T>({
  when,
  count = 3,
  delay = 200,
  maxDelay = 15000,
}: {
  when?: (err: any) => boolean;
  count?: number;
  delay?: number;
  maxDelay?: number;
} = {}) {
  return (obs$: Observable<T>) =>
    obs$.pipe(
      retry({
        count,
        delay: (err, retryIndex) => {
          if (when && !when(err)) {
            return throwError(() => err);
          }
          const d = Math.pow(2, retryIndex - 1) * delay;
          return timer(Math.min(d, maxDelay));
        },
      })
    );
}

export function smartRetry<T>({
  count = 3,
  delay = 200,
  maxDelay = 15000,
}: {
  count?: number;
  delay?: number;
  maxDelay?: number;
} = {}) {
  return (obs$: Observable<T>) =>
    obs$.pipe(
      backoffRetry({
        when: UserFriendlyError.isNetworkError,
        count: Infinity,
        delay,
        maxDelay,
      }),
      backoffRetry({
        when: UserFriendlyError.notNetworkError,
        count,
        delay,
        maxDelay,
      })
    );
}

/**
 * 一个结合了`exhaustMap`和`switchMap`的操作符。
 *
 * 该操作符对每个输入执行`comparator`，当`comparator`返回`true`时作为`exhaustMap`，
 * 当comparator返回`false`时作为`switchMap`。
 *
 * 它对于结果相对稳定但对输入敏感的异步进程更有用。
 * 例如，在请求用户的订阅状态时，使用`exhaustMap`因为用户的订阅
 * 不经常变化，但在切换用户时，应该像`switchMap`一样立即发出请求。
 *
 * @param onSwitch 当发生`switchMap`时将执行的回调（包括第一次执行）。
 */
export function exhaustMapSwitchUntilChanged<T, O extends ObservableInput<any>>(
  comparator: (previous: T, current: T) => boolean,
  project: (value: T, index: number) => O,
  onSwitch?: (value: T) => void
): OperatorFunction<T, ObservedValueOf<O>> {
  return pipe(
    connect(shared$ =>
      shared$.pipe(
        distinctUntilChanged(comparator),
        switchMap(value => {
          onSwitch?.(value);
          return merge(of(value), shared$).pipe(
            exhaustMap((value, index) => {
              return project(value, index);
            })
          );
        })
      )
    )
  );
}
