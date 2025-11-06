import { createLitPortal } from '@blocksuite/yunke-components/portal';
import {
  AttachmentBlockModel,
  defaultAttachmentProps,
  type EmbedCardStyle,
} from '@blocksuite/yunke-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/yunke-shared/consts';
import {
  ActionPlacement,
  type ToolbarAction,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/yunke-shared/services';
import { getBlockProps } from '@blocksuite/yunke-shared/utils';
import { Bound } from '@blocksuite/global/gfx';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
  OpenInNewIcon,
  ReplaceIcon,
  ResetIcon,
} from '@blocksuite/icons/lit';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { computed } from '@preact/signals-core';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import { AttachmentBlockComponent } from '../attachment-block';
import { RenameModal } from '../components/rename-model';
import { AttachmentEmbedProvider } from '../embed';
import { isAttachmentEditable } from '../utils';
import { dispatchAttachmentTrashEvent } from '../trash';
import { toast } from '@blocksuite/yunke-components/toast';

console.log('[Toolbar] Attachment toolbar config loaded');

const trackBaseProps = {
  category: 'attachment',
  type: 'card view',
};

export const attachmentViewDropdownMenu = {
  id: 'b.conversions',
  actions: [
    {
      id: 'card',
              label: '卡片视图',
      run(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return;

        const style = defaultAttachmentProps.style!;
        const width = EMBED_CARD_WIDTH[style];
        const height = EMBED_CARD_HEIGHT[style];
        const bounds = Bound.deserialize(model.xywh);
        bounds.w = width;
        bounds.h = height;

        ctx.store.updateBlock(model, {
          style,
          embed: false,
          xywh: bounds.serialize(),
        });
      },
    },
    {
      id: 'embed',
              label: '嵌入视图',
      disabled: ctx => {
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        return block ? !block.embedded() : true;
      },
      run(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return;

        const provider = ctx.std.get(AttachmentEmbedProvider);

        // TODO(@fundon): should auto focus image block.
        if (
          provider.shouldBeConverted(model) &&
          !ctx.hasSelectedSurfaceModels
        ) {
          // Clears
          ctx.reset();
          ctx.select('note');
        }

        provider.convertTo(model);

        ctx.track('SelectedView', {
          ...trackBaseProps,
          control: 'select view',
          type: 'embed view',
        });
      },
    },
  ],
  content(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) return null;

    const model = block.model;
    const embedProvider = ctx.std.get(AttachmentEmbedProvider);
    const actions = computed(() => {
      const [cardAction, embedAction] = this.actions.map(action => ({
        ...action,
      }));

      const ok = block.resourceController.resolvedState$.value.state === 'none';
      const sourceId = Boolean(model.props.sourceId$.value);
      const embed = model.props.embed$.value ?? false;
      // 1. Check whether `sourceId` exists.
      // 2. Check if `embedded` is allowed.
      // 3. Check `blobState$`
      const allowed = ok && sourceId && embedProvider.embedded(model) && !embed;

      cardAction.disabled = !embed;
      embedAction.disabled = !allowed;

      return [cardAction, embedAction];
    });
    const viewType$ = computed(() => {
      const [cardAction, embedAction] = actions.value;
      const embed = model.props.embed$.value ?? false;
      return embed ? embedAction.label : cardAction.label;
    });
    const onToggle = (e: CustomEvent<boolean>) => {
      e.stopPropagation();
      const opened = e.detail;
      if (!opened) return;

      ctx.track('OpenedViewSelector', {
        ...trackBaseProps,
        control: 'switch view',
      });
    };

    return html`${keyed(
      model,
      html`<yunke-view-dropdown-menu
        @toggle=${onToggle}
        .actions=${actions.value}
        .context=${ctx}
        .viewType$=${viewType$}
      ></yunke-view-dropdown-menu>`
    )}`;
  },
} as const satisfies ToolbarActionGroup<ToolbarAction>;

const openAction = {
  id: 'b.open',
  tooltip: '打开',
  icon: ResetIcon(), // Using ResetIcon as placeholder, can be replaced with ExpandFullIcon if available
  disabled(ctx) {
    console.log('[Toolbar] openAction disabled() called');
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.log('[Toolbar] openAction disabled: no block');
      return true;
    }

    const state = block.resourceController.state$.value;
    const { downloading = false, uploading = false } = state;
    
    // Only disable if downloading or uploading, let run() handle other cases
    const isDisabled = downloading || uploading;
    
    console.log('[Toolbar] openAction disabled check:', {
      isDisabled,
      downloading,
      uploading,
      state,
    });
    
    return isDisabled;
  },
  run(ctx) {
    console.log('[Toolbar] ========== openAction RUN called ==========');
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.warn('[Toolbar] openAction RUN: no block found');
      return;
    }
    
    const blobUrl = block.blobUrl;
    const sourceId = block.model.props.sourceId$.value;
    
    console.log('[Toolbar] openAction RUN:', {
      hasBlobUrl: !!blobUrl,
      hasSourceId: !!sourceId,
      blockId: block.blockId,
    });
    
    if (!sourceId) {
      console.warn('[Toolbar] openAction RUN: no sourceId');
      toast(block.host, '文件资源不存在');
      return;
    }
    
    if (!blobUrl) {
      console.warn('[Toolbar] openAction RUN: blobUrl not ready, state:', block.resourceController.state$.value);
      toast(block.host, '文件尚未准备好，请稍后再试');
      // Try to refresh the URL
      block.refreshData();
      return;
    }
    
    console.log('[Toolbar] openAction RUN: calling openPreview');
    block.openPreview().catch((error: Error) => {
      console.error('[Toolbar] Failed to open preview:', error);
      toast(block.host, '打开预览失败: ' + (error.message || '未知错误'));
    });
  },
} as const satisfies ToolbarAction;

const openExternalAction = {
  id: 'b.open-external',
  tooltip: '在外部应用中打开',
  icon: OpenInNewIcon(),
  disabled(ctx) {
    console.log('[Toolbar] openExternalAction disabled() called');
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.log('[Toolbar] openExternalAction disabled: no block');
      return true;
    }

    const state = block.resourceController.state$.value;
    const { downloading = false, uploading = false } = state;
    
    // Only disable if downloading or uploading, let run() handle other cases
    const isDisabled = downloading || uploading;
    
    console.log('[Toolbar] openExternalAction disabled check:', {
      isDisabled,
      downloading,
      uploading,
      state,
    });
    
    return isDisabled;
  },
  run(ctx) {
    console.log('[Toolbar] ========== openExternalAction RUN called ==========');
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.warn('[Toolbar] openExternalAction RUN: no block found');
      return;
    }
    
    const blobUrl = block.blobUrl;
    const sourceId = block.model.props.sourceId$.value;
    
    console.log('[Toolbar] openExternalAction RUN:', {
      hasBlobUrl: !!blobUrl,
      hasSourceId: !!sourceId,
      blockId: block.blockId,
    });
    
    if (!sourceId) {
      console.warn('[Toolbar] openExternalAction RUN: no sourceId');
      toast(block.host, '文件资源不存在');
      return;
    }
    
    console.log('[Toolbar] openExternalAction RUN: calling openExternal');
    // openExternal will handle blobUrl not ready case, so we can call it directly
    block.openExternal().catch(error => {
      console.error('[Toolbar] Failed to open externally:', error);
      toast(block.host, '打开外部应用失败: ' + (error.message || '未知错误'));
    });
  },
} as const satisfies ToolbarAction;

const editInlineAction = {
  id: 'b.edit-inline',
  tooltip: '编辑附件',
  icon: EditIcon(),
  disabled(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.log('[Toolbar] editInlineAction disabled: no block');
      return true;
    }
    const { downloading = false, uploading = false } =
      block.resourceController.state$.value;
    if (downloading || uploading) {
      console.log('[Toolbar] editInlineAction disabled: downloading/uploading');
      return true;
    }
    const name = block.model.props.name;
    const type = block.model.props.type;
    const isEditable = isAttachmentEditable(type, name);
    if (!isEditable) {
      console.log('[Toolbar] editInlineAction disabled: not editable', { type, name });
    } else {
      console.log('[Toolbar] editInlineAction ENABLED:', { type, name });
    }
    return !isEditable;
  },
  run(ctx) {
    console.log('[Toolbar] editInlineAction RUN called');
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.error('[Toolbar] editInlineAction RUN: No attachment block found for edit action');
      return;
    }
    console.log('[Toolbar] editInlineAction RUN: calling block.edit()');
    block.edit().catch(error => {
      console.error('[Toolbar] Error from edit action:', error);
      toast(block.host, '编辑失败: ' + (error.message || '未知错误'));
    });
  },
} as const satisfies ToolbarAction;

const replaceAction = {
  id: 'c.replace',
  tooltip: '替换附件',
  icon: ReplaceIcon(),
  disabled(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) return true;

    const { downloading = false, uploading = false } =
      block.resourceController.state$.value;
    return downloading || uploading;
  },
  run(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    block?.replace().catch(console.error);
  },
} as const satisfies ToolbarAction;

const downloadAction = {
  id: 'd.download',
  tooltip: '下载',
  icon: DownloadIcon(),
  run(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    block?.download();
  },
  when(ctx) {
    const model = ctx.getCurrentModelByType(AttachmentBlockModel);
    if (!model) return false;
    // Current citation attachment block does not support download
    return model.props.style !== 'citation' && !model.props.footnoteIdentifier;
  },
} as const satisfies ToolbarAction;

const captionAction = {
  id: 'e.caption',
  tooltip: '标题',
  icon: CaptionIcon(),
  run(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    block?.captionEditor?.show();

    ctx.track('OpenedCaptionEditor', {
      ...trackBaseProps,
      control: 'add caption',
    });
  },
} as const satisfies ToolbarAction;


const builtinToolbarConfig = {
  actions: [
    {
      id: 'a.rename',
      content(ctx) {
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        if (!block) return null;

        const abortController = new AbortController();
        abortController.signal.onabort = () => ctx.show();

        return html`
          <editor-icon-button
            aria-label="重命名"
            .tooltip="${'重命名'}"
            @click=${() => {
              ctx.hide();

              createLitPortal({
                template: RenameModal({
                  model: block.model,
                  editorHost: ctx.host,
                  abortController,
                }),
                computePosition: {
                  referenceElement: block,
                  placement: 'top-start',
                  middleware: [flip(), offset(4)],
                },
                abortController,
              });
            }}
          >
            ${EditIcon()}
          </editor-icon-button>
        `;
      },
    },
    openAction,
    openExternalAction,
    editInlineAction,
    attachmentViewDropdownMenu,
    replaceAction,
    downloadAction,
    captionAction,
    {
      placement: ActionPlacement.More,
      id: 'a.clipboard',
      actions: [
        {
          id: 'copy',
          label: '复制',
          icon: CopyIcon(),
          run(ctx) {
            // TODO(@fundon): unify `clone` method
            const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
            block?.copy();
          },
        },
        {
          id: 'duplicate',
          label: '复制',
          icon: DuplicateIcon(),
          run(ctx) {
            const model = ctx.getCurrentModelByType(AttachmentBlockModel);
            if (!model) return;

            // TODO(@fundon): unify `duplicate` method
            ctx.store.addSiblingBlocks(model, [
              {
                flavour: model.flavour,
                ...getBlockProps(model),
              },
            ]);
          },
        },
      ],
    },
    {
      placement: ActionPlacement.More,
      id: 'b.refresh',
      label: '重新加载',
      icon: ResetIcon(),
      run(ctx) {
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        block?.reload();

        ctx.track('AttachmentReloadedEvent', {
          ...trackBaseProps,
          control: 'reload',
          type: block?.model.props.name.split('.').pop() ?? '',
        });
      },
    },
    {
      placement: ActionPlacement.More,
      id: 'c.delete',
      label: '删除',
      icon: DeleteIcon(),
      variant: 'destructive',
      run(ctx) {
        const model = ctx.getCurrentModel();
        if (!model) return;

        // Dispatch trash event before deletion
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        if (block && model.id && ctx.getCurrentModelByType(AttachmentBlockModel)) {
          dispatchAttachmentTrashEvent(block);
        }

        ctx.store.deleteBlock(model.id);

        // Clears
        ctx.select('note');
        ctx.reset();
      },
    },
  ],
} as const satisfies ToolbarModuleConfig;

const builtinSurfaceToolbarConfig = {
  actions: [
    attachmentViewDropdownMenu,
    openAction,
    openExternalAction,
    editInlineAction,
    {
      id: 'c.style',
      actions: [
        {
          id: 'horizontalThin',
          label: '水平样式',
        },
        {
          id: 'cubeThick',
          label: '垂直样式',
        },
      ],
      content(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return null;

        const actions = this.actions.map(action => ({
          ...action,
          run: ({ store }) => {
            const style = action.id as EmbedCardStyle;
            const bounds = Bound.deserialize(model.xywh);
            bounds.w = EMBED_CARD_WIDTH[style];
            bounds.h = EMBED_CARD_HEIGHT[style];
            const xywh = bounds.serialize();

            store.updateBlock(model, { style, xywh });

            ctx.track('SelectedCardStyle', {
              ...trackBaseProps,
              page: 'whiteboard editor',
              control: 'select card style',
              type: style,
            });
          },
        })) satisfies ToolbarAction[];
        const style$ = model.props.style$;
        const onToggle = (e: CustomEvent<boolean>) => {
          e.stopPropagation();
          const opened = e.detail;
          if (!opened) return;

          ctx.track('OpenedCardStyleSelector', {
            ...trackBaseProps,
            page: 'whiteboard editor',
            control: 'switch card style',
          });
        };

        return html`${keyed(
          model,
          html`<yunke-card-style-dropdown-menu
            @toggle=${onToggle}
            .actions=${actions}
            .context=${ctx}
            .style$=${style$}
          ></yunke-card-style-dropdown-menu>`
        )}`;
      },
    } satisfies ToolbarActionGroup<ToolbarAction>,
    {
      ...downloadAction,
      id: 'e.download',
    },
    {
      ...captionAction,
      id: 'f.caption',
    },
  ],
  when: ctx => ctx.getSurfaceModelsByType(AttachmentBlockModel).length === 1,
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
      id: BlockFlavourIdentifier(`yunke:surface:${name}`),
      config: builtinSurfaceToolbarConfig,
    }),
  ];
};
