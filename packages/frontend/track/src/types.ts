import type { EventArgs, Events } from './events';

type EventPropsOverride = {
  page?: keyof Events;
  segment?: string;
  module?: string;
  control?: string;
};

export type CallableEventsChain = {
  [Page in keyof Events]: {
    [Segment in keyof Events[Page]]: {
      [Module in keyof Events[Page][Segment]]: {
        [Event in Events[Page][Segment][Module][number]]: Event extends keyof EventArgs
          ? (
              // 我们将所有参数设为可选以简化空值类型检查
              args?: Partial<EventArgs[Event]> & EventPropsOverride
            ) => void
          : (args?: EventPropsOverride) => void;
      };
    };
  };
};

export type EventsUnion = {
  [Page in keyof Events]: {
    [Segment in keyof Events[Page]]: {
      [Module in keyof Events[Page][Segment]]: {
        // @ts-expect-error 忽略`symbol | number`作为键的错误
        [Event in Events[Page][Segment][Module][number]]: `${Page}.${Segment}.${Module}.${Event}`;
      }[Events[Page][Segment][Module][number]];
    }[keyof Events[Page][Segment]];
  }[keyof Events[Page]];
}[keyof Events];

// 页面 > 段落 > 模块 > [事件列表]
type IsFourLevelsDeep<
  T,
  Depth extends number[] = [],
> = Depth['length'] extends 3
  ? T extends Array<any>
    ? true
    : false
  : T extends object
    ? {
        [K in keyof T]: IsFourLevelsDeep<T[K], [...Depth, 0]>;
      }[keyof T] extends true
      ? true
      : false
    : false;

// 用于类型检查
export const _assertIsAllEventsDefinedInFourLevels: IsFourLevelsDeep<Events> =
  true;

export interface EventProps {
  // 位置信息
  page?: keyof Events;
  segment?: string;
  module?: string;
  control?: string;
  arg?: string;

  // 实体信息
  type?: string;
  category?: string;
  id?: string;
}
