import { DebugLogger } from '@affine/debug';
import { Unreachable } from '@affine/env/constant';
import { type OperatorFunction, Subject, type Subscription } from 'rxjs';

const logger = new DebugLogger('effect');

export type Effect<T> = (T | undefined extends T // hack to detect if T is unknown
  ? () => void
  : (value: T) => void) & {
  // 取消订阅副作用，所有正在进行的副作用将被取消。
  unsubscribe: () => void;
  // 重置内部状态，所有正在进行的副作用将被取消。
  reset: () => void;
};

/**
 * 创建一个副作用。
 *
 * `effect( op1, op2, op3, ... )`
 *
 * 您可以将副作用视为一个管道。当调用副作用时，参数将被发送到管道，
 * 管道中的操作符可以被触发。
 *
 *
 *
 * @example
 * ```ts
 * const loadUser = effect(
 *   switchMap((id: number) =>
 *     from(fetchUser(id)).pipe(
 *       mapInto(user$),
 *       catchErrorInto(error$),
 *       onStart(() => isLoading$.next(true)),
 *       onComplete(() => isLoading$.next(false))
 *     )
 *   )
 * );
 *
 * // 向副作用发出值
 * loadUser(1);
 *
 * // 取消订阅副作用，将停止所有正在进行的进程
 * loadUser.unsubscribe();
 * ```
 */
export function effect<T, A>(op1: OperatorFunction<T, A>): Effect<T>;
export function effect<T, A, B>(
  op1: OperatorFunction<T, A>,
  op2: OperatorFunction<A, B>
): Effect<T>;
export function effect<T, A, B, C>(
  op1: OperatorFunction<T, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>
): Effect<T>;
export function effect<T, A, B, C, D>(
  op1: OperatorFunction<T, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>
): Effect<T>;
export function effect<T, A, B, C, D, E>(
  op1: OperatorFunction<T, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>
): Effect<T>;
export function effect<T, A, B, C, D, E, F>(
  op1: OperatorFunction<T, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>,
  op6: OperatorFunction<E, F>
): Effect<T>;
export function effect(...args: any[]) {
  const subject$ = new Subject<any>();

  const effectLocation = BUILD_CONFIG.debug
    ? `(${new Error().stack?.split('\n')[2].trim()})`
    : '';

  class EffectError extends Unreachable {
    constructor(message: string, value?: any) {
      logger.error(`effect ${effectLocation} ${message}`, value);
      super(
        `effect ${effectLocation} ${message}` +
          ` ${value ? (value instanceof Error ? (value.stack ?? value.message) : value + '') : ''}`
      );
    }
  }

  let subscription: Subscription | null = null;

  function subscribe() {
    subscription = subject$.pipe.apply(subject$, args as any).subscribe({
      complete() {
        const error = new EffectError('副作用意外完成');
        // 制造一个未捕获异常
        setTimeout(() => {
          throw error;
        }, 0);
      },
      error(error) {
        const effectError = new EffectError('副作用未捕获错误', error);
        // 制造一个未捕获异常
        setTimeout(() => {
          throw effectError;
        }, 0);
      },
    });
  }
  subscribe();

  const fn = (value: unknown) => {
    subject$.next(value);
  };

  fn.unsubscribe = () => subscription?.unsubscribe();
  fn.reset = () => {
    subscription?.unsubscribe();
    subscribe();
  };

  return fn as never;
}
