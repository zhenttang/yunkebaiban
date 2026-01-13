import { createContext } from 'react';

import type { DNDData, fromExternalData, toExternalData } from './types';

export const DNDContext = createContext<{
  /**
   * 外部数据适配器。
   * 将外部数据转换为 Yunke 认识的可拖动数据。
   *
   * 如果提供了此项，放置目标也将处理外部元素。
   *
   * @default undefined
   */
  fromExternalData?: fromExternalData<DNDData>;

  /**
   * 将可拖动数据转换为外部数据。
   * 主要用于被 blocksuite 消费。
   *
   * @default undefined
   */
  toExternalData?: toExternalData<DNDData>;
}>({});
