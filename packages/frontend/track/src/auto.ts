import { DebugLogger } from '@yunke/debug';

import type { CallableEventsChain, EventsUnion } from './types';

const logger = new DebugLogger('mixpanel');

interface TrackFn {
  (event: string, props: Record<string, any>): void;
}

const levels = ['page', 'segment', 'module', 'event'] as const;
export function makeTracker(trackFn: TrackFn): CallableEventsChain {
  function makeTrackerInner(level: number, info: Record<string, string>) {
    const proxy = new Proxy({} as Record<string, any>, {
      get(target, prop) {
        if (
          typeof prop !== 'string' ||
          prop === '$$typeof' /* webpack热重载读取此属性 */
        ) {
          return undefined;
        }

        if (levels[level] === 'event') {
          return (arg: string | Record<string, any>) => {
            trackFn(prop, {
              ...info,
              ...(typeof arg === 'string' ? { arg } : arg),
            });
          };
        } else {
          let levelProxy = target[prop];
          if (levelProxy) {
            return levelProxy;
          }

          levelProxy = makeTrackerInner(
            level + 1,
            prop === '$' ? { ...info } : { ...info, [levels[level]]: prop }
          );
          target[prop] = levelProxy;
          return levelProxy;
        }
      },
    });

    return proxy;
  }

  return makeTrackerInner(0, {}) as CallableEventsChain;
}

/**
 * 监听所有子树元素的点击，如果定义了相关事件则自动追踪
 *
 * @example
 *
 * ```html
 * <button
 *   data-event-chain='$.cmdk.settings.changeLanguage'
 *   data-event-arg='cn'
 *   <!-- 或者 -->
 *   data-event-args-foo='bar'
 * />
 * ```
 */
export function enableAutoTrack(root: HTMLElement, trackFn: TrackFn) {
  const listener = (e: Event) => {
    const el = e.target as HTMLElement | null;
    if (!el) {
      return;
    }
    const dataset = el.dataset;

    if (dataset['eventProps']) {
      const args: Record<string, any> = {};
      if (dataset['eventArg'] !== undefined) {
        args['arg'] = dataset['event-arg'];
      } else {
        for (const argName of Object.keys(dataset)) {
          if (argName.startsWith('eventArgs')) {
            args[argName.slice(9).toLowerCase()] = dataset[argName];
          }
        }
      }

      const props = dataset['eventProps']
        .split('.')
        .map(name => (name === '$' ? undefined : name));
      if (props.length !== levels.length) {
        logger.error('元素上的事件属性无效', el);
        return;
      }

      const event = props[3];

      if (!event) {
        logger.error('元素上的事件属性无效', el);
        return;
      }

      trackFn(event, {
        page: props[0] as any,
        segment: props[1],
        module: props[2],
        ...args,
      });
    }
  };

  root.addEventListener('click', listener, {});
  return () => {
    root.removeEventListener('click', listener);
  };
}

declare module 'react' {
  // 我们必须声明 `T` 但实际上并未使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    'data-event-props'?: EventsUnion;
    'data-event-arg'?: string;
    'data-event-args-control'?: string;
  }
}
