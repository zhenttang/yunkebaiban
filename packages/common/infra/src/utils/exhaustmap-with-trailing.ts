import {
  asyncScheduler,
  defer,
  exhaustMap,
  finalize,
  type Observable,
  type ObservableInput,
  type OperatorFunction,
  scheduled,
  Subject,
  throttle,
} from 'rxjs';

/**
 * 类似exhaustMap，但还包括在等待前一个内部可观察对象完成时从源可观察对象发出的尾随值
 *
 * 原始代码改编自 https://github.com/ReactiveX/rxjs/issues/5004
 * @param {function<T, K>(value: T, ?index: number): ObservableInput<K>} project - 一个函数，当应用于源
 * Observable发出的项目时，返回一个投影的Observable。
 */
export function exhaustMapWithTrailing<T, R>(
  project: (value: T, index: number) => ObservableInput<R>
): OperatorFunction<T, R> {
  return (source$): Observable<R> =>
    defer(() => {
      const release$ = new Subject<void>();
      return source$.pipe(
        throttle(() => release$, {
          leading: true,
          trailing: true,
        }),
        exhaustMap((value, index) =>
          scheduled(project(value, index), asyncScheduler).pipe(
            finalize(() => {
              release$.next();
            })
          )
        )
      );
    });
}
