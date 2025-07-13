import type { SlashMenuTooltip } from '../types';
import { CopyTooltip } from './copy';
import { DeleteTooltip } from './delete';
import { MoveDownTooltip } from './move-down';
import { MoveUpTooltip } from './move-up';
import { NowTooltip } from './now';
import { TodayTooltip } from './today';
import { TomorrowTooltip } from './tomorrow';
import { YesterdayTooltip } from './yesterday';

export const slashMenuToolTips: Record<string, SlashMenuTooltip> = {
  Today: {
    figure: TodayTooltip,
    caption: '今天',
  },

  Tomorrow: {
    figure: TomorrowTooltip,
    caption: '明天',
  },

  Yesterday: {
    figure: YesterdayTooltip,
    caption: '昨天',
  },

  Now: {
    figure: NowTooltip,
    caption: '现在',
  },

  'Move Up': {
    figure: MoveUpTooltip,
    caption: '上移',
  },

  'Move Down': {
    figure: MoveDownTooltip,
    caption: '下移',
  },

  Copy: {
    figure: CopyTooltip,
    caption: '复制/复制',
  },

  Delete: {
    figure: DeleteTooltip,
    caption: '删除',
  },
};
