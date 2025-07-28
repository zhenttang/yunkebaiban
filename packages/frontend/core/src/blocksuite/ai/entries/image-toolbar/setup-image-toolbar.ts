import '../../components/ask-ai-button';

import { ImageBlockComponent } from '@blocksuite/affine/blocks/image';
import {
  ActionPlacement,
  type ToolbarModuleConfig,
} from '@blocksuite/affine/shared/services';
import { BlockSelection } from '@blocksuite/affine/std';
import { ScissorsIcon, DownloadIcon, CopyIcon, EditIcon, LockIcon, MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { html } from 'lit';

import { buildAIImageItemGroups } from '../../_common/config';
import type { AskAIButtonOptions } from '../../components/ask-ai-button';

const AIImageItemGroups = buildAIImageItemGroups();
const buttonOptions: AskAIButtonOptions = {
  size: 'small',
  backgroundColor: 'var(--affine-white)',
  panelWidth: 300,
};

export function imageToolbarAIEntryConfig(): ToolbarModuleConfig {
  return {
    actions: [
      {
        placement: ActionPlacement.Start,
        id: 'A.ai',
        score: -1,
        content: ctx => {
          const block = ctx.getCurrentBlockByType(ImageBlockComponent);
          if (!block) return null;

          return html`<ask-ai-button
            class="ask-ai inner-button"
            .host=${ctx.host}
            .actionGroups=${AIImageItemGroups}
            .toggleType="${'click'}"
            .options=${buttonOptions}
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              ctx.selection.update(() => [
                ctx.selection.create(BlockSelection, {
                  blockId: block.blockId,
                }),
              ]);
            }}
          ></ask-ai-button>`;
        },
      },
      {
        placement: ActionPlacement.Start,
        id: 'B.crop',
        score: 0,
        tooltip: '剪裁',
        icon: ScissorsIcon(),
        when: ctx => {
          const block = ctx.getCurrentBlockByType(ImageBlockComponent);
          return Boolean(block?.blobUrl);
        },
        run: ctx => {
          console.log('=== CROP BUTTON CLICKED IN AI TOOLBAR ===');
          const block = ctx.getCurrentBlockByType(ImageBlockComponent);
          console.log('Block found:', block);
          if (block) {
            console.log('Calling openCropModal on block');
            block.openCropModal();
          } else {
            console.error('No image block found in context');
          }
        },
      },
      {
        placement: ActionPlacement.Start,
        id: 'C.download',
        score: 1,
        tooltip: '下载',
        icon: DownloadIcon(),
        run: ctx => {
          const block = ctx.getCurrentBlockByType(ImageBlockComponent);
          block?.download();
        },
      },
      {
        placement: ActionPlacement.Start,
        id: 'D.copy',
        score: 2,
        tooltip: '复制',
        icon: CopyIcon(),
        run: ctx => {
          const block = ctx.getCurrentBlockByType(ImageBlockComponent);
          block?.copy();
        },
      },
      {
        placement: ActionPlacement.Start,
        id: 'E.edit',
        score: 3,
        tooltip: '编辑',
        icon: EditIcon(),
        run: ctx => {
          console.log('Edit button clicked');
          // 这里可以添加编辑功能
        },
      },
      {
        placement: ActionPlacement.Start,
        id: 'F.lock',
        score: 4,
        tooltip: '锁定',
        icon: LockIcon(),
        run: ctx => {
          console.log('Lock button clicked');
          // 这里可以添加锁定功能
        },
      },
      {
        placement: ActionPlacement.Start,
        id: 'G.more',
        score: 5,
        tooltip: '更多',
        icon: MoreHorizontalIcon(),
        run: ctx => {
          console.log('More button clicked');
          // 这里可以添加更多功能菜单
        },
      },
    ],
  };
}
