import { ImageBlockModel } from '@blocksuite/affine-model';
import {
  ActionPlacement,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/affine-shared/services';
import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
} from '@blocksuite/icons/lit';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';

import { ImageBlockComponent } from '../image-block';
import { ImageEdgelessBlockComponent } from '../image-edgeless-block';
import { duplicate } from '../utils';
import { openDeckerEditor, openDeckerEditorWithData } from '@affine/core/modules/decker-integration/decker-integration-manager';

const trackBaseProps = {
  category: 'image',
  type: 'card view',
};

const builtinToolbarConfig = {
  actions: [
    {
      id: 'b.download',
      tooltip: '下载',
      icon: DownloadIcon(),
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageBlockComponent);
        block?.download();
      },
    },
    {
      id: 'd.decker-edit',
      tooltip: '用Decker编辑',
      icon: EditIcon(),
      when(ctx) {
        const block = ctx.getCurrentBlockByType(ImageBlockComponent);
        if (!block?.model?.customData) return false;
        
        try {
          const customData = JSON.parse(block.model.customData);
          return customData.type === 'deck' && customData.deckData;
        } catch {
          return false;
        }
      },
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageBlockComponent);
        if (!block?.model?.customData) return;
        
        try {
          const customData = JSON.parse(block.model.customData);
          if (customData.type === 'deck' && customData.deckData) {
            openDeckerEditorWithData(customData.deckData);
          }
        } catch (error) {
          console.error('解析deck数据失败:', error);
        }
      },
    },
    {
      id: 'e.decker-new',
      tooltip: '新建Decker绘画',
      icon: '🎨',
      run(ctx) {
        openDeckerEditor();
      },
    },
    {
      id: 'a.crop',
      tooltip: '剪裁',
      icon: EditIcon(),
      when(ctx) {
        console.log('Crop button when condition checked');
        const block = ctx.getCurrentBlockByType(ImageBlockComponent);
        const hasBlob = Boolean(block?.blobUrl);
        console.log('Has blob URL:', hasBlob, 'Block:', block);
        return hasBlob;
      },
      run(ctx) {
        console.log('=== CROP BUTTON CLICKED ===');
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
      id: 'c.caption',
      tooltip: '标题',
      icon: CaptionIcon(),
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageBlockComponent);
        block?.captionEditor?.show();

        ctx.track('OpenedCaptionEditor', {
          ...trackBaseProps,
          control: 'add caption',
        });
      },
    },
    {
      placement: ActionPlacement.More,
      id: 'a.clipboard',
      actions: [
        {
          id: 'a.copy',
          label: '复制',
          icon: CopyIcon(),
          run(ctx) {
            const block = ctx.getCurrentBlockByType(ImageBlockComponent);
            block?.copy();
          },
        },
        {
          id: 'b.duplicate',
          label: '创建副本',
          icon: DuplicateIcon(),
          run(ctx) {
            const block = ctx.getCurrentBlockByType(ImageBlockComponent);
            if (!block) return;

            duplicate(block);
          },
        },
      ],
    },
    {
      placement: ActionPlacement.More,
      id: 'b.conversions',
      actions: [
        {
          id: 'a.turn-into-card-view',
          label: '转换为卡片视图',
          icon: BookmarkIcon(),
          when(ctx) {
            const supported =
              ctx.store.schema.flavourSchemaMap.has('affine:attachment');
            if (!supported) return false;

            const block = ctx.getCurrentBlockByType(ImageBlockComponent);
            return Boolean(block?.blobUrl);
          },
          run(ctx) {
            const block = ctx.getCurrentBlockByType(ImageBlockComponent);
            block?.convertToCardView();
          },
        },
      ],
    },
    {
      placement: ActionPlacement.More,
      id: 'c.delete',
      label: '删除',
      icon: DeleteIcon(),
      variant: 'destructive',
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageBlockComponent);
        if (!block) return;

        ctx.store.deleteBlock(block.model);
      },
    },
  ],

  placement: 'inner',
} as const satisfies ToolbarModuleConfig;

const builtinSurfaceToolbarConfig = {
  actions: [
    {
      id: 'a.crop',
      tooltip: '剪裁',
      icon: EditIcon(),
      when(ctx) {
        const surfaces = ctx.getSurfaceModelsByType(ImageBlockModel);
        return surfaces.length === 1 && Boolean(surfaces[0]?.props.sourceId);
      },
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageEdgelessBlockComponent);
        block?.openCropModal();
      },
    },
    {
      id: 'b.download',
      tooltip: '下载',
      icon: DownloadIcon(),
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageEdgelessBlockComponent);
        block?.download();
      },
    },
    {
      id: 'c.caption',
      tooltip: '标题',
      icon: CaptionIcon(),
      run(ctx) {
        const block = ctx.getCurrentBlockByType(ImageEdgelessBlockComponent);
        block?.captionEditor?.show();

        ctx.track('OpenedCaptionEditor', {
          ...trackBaseProps,
          control: 'add caption',
        });
      },
    },
  ],

  when: ctx => ctx.getSurfaceModelsByType(ImageBlockModel).length === 1,
} as const satisfies ToolbarModuleConfig;

export const createBuiltinToolbarConfigExtension = (
  flavour: string
): ExtensionType[] => {
  const name = flavour.split(':').pop();

  return [
    ToolbarModuleExtension({
      id: BlockFlavourIdentifier(flavour),
      config: builtinToolbarConfig,
    }),

    ToolbarModuleExtension({
      id: BlockFlavourIdentifier(`affine:surface:${name}`),
      config: builtinSurfaceToolbarConfig,
    }),
  ];
};
