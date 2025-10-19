import { toast } from '@blocksuite/yunke-components/toast';
import { EmbedHtmlModel } from '@blocksuite/yunke-model';
import {
  ActionPlacement,
  type ToolbarAction,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/yunke-shared/services';
import { getBlockProps } from '@blocksuite/yunke-shared/utils';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  ExpandFullIcon,
} from '@blocksuite/icons/lit';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import { type ExtensionType, Slice } from '@blocksuite/store';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import { EmbedHtmlBlockComponent } from '../embed-html-block';

const trackBaseProps = {
  category: 'html',
  type: 'card view',
};

const openDocAction = {
  id: 'a.open-doc',
  icon: ExpandFullIcon(),
  tooltip: 'Open this doc',
  run(ctx) {
    const block = ctx.getCurrentBlockByType(EmbedHtmlBlockComponent);
    block?.open();
  },
} as const satisfies ToolbarAction;

const captionAction = {
  id: 'c.caption',
  tooltip: '标题',
  icon: CaptionIcon(),
  run(ctx) {
    const block = ctx.getCurrentBlockByType(EmbedHtmlBlockComponent);
    block?.captionEditor?.show();

    ctx.track('OpenedCaptionEditor', {
      ...trackBaseProps,
      control: 'add caption',
    });
  },
} as const satisfies ToolbarAction;

const builtinToolbarConfig = {
  actions: [
    openDocAction,
    {
      id: 'b.style',
      actions: [
        {
          id: 'horizontal',
          label: '大型水平样式',
        },
        {
          id: 'list',
          label: '小型水平样式',
        },
      ],
      content(ctx) {
        const model = ctx.getCurrentModelByType(EmbedHtmlModel);
        if (!model) return null;

        const actions = this.actions.map<ToolbarAction>(action => ({
          ...action,
          run: ({ store }) => {
            store.updateBlock(model, { style: action.id });

            ctx.track('SelectedCardStyle', {
              ...trackBaseProps,
              control: 'select card style',
              type: action.id,
            });
          },
        }));
        const onToggle = (e: CustomEvent<boolean>) => {
          e.stopPropagation();
          const opened = e.detail;
          if (!opened) return;

          ctx.track('OpenedCardStyleSelector', {
            ...trackBaseProps,
            control: 'switch card style',
          });
        };

        return html`${keyed(
          model,
          html`<affine-card-style-dropdown-menu
            @toggle=${onToggle}
            .actions=${actions}
            .context=${ctx}
            .style=${model.props.style$}
          ></affine-card-style-dropdown-menu>`
        )}`;
      },
    } satisfies ToolbarActionGroup<ToolbarAction>,
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
            const model = ctx.getCurrentModelByType(EmbedHtmlModel);
            if (!model) return;

            const slice = Slice.fromModels(ctx.store, [model]);
            ctx.clipboard
              .copySlice(slice)
              .then(() => toast(ctx.host, '已复制到剪贴板'))
              .catch(console.error);
          },
        },
        {
          id: 'duplicate',
          label: '复制',
          icon: DuplicateIcon(),
          run(ctx) {
            const model = ctx.getCurrentModelByType(EmbedHtmlModel);
            if (!model) return;

            const { flavour, parent } = model;
            const props = getBlockProps(model);
            const index = parent?.children.indexOf(model);

            ctx.store.addBlock(flavour, props, parent, index);
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
        const model = ctx.getCurrentModelByType(EmbedHtmlModel);
        if (!model) return;

        ctx.store.deleteBlock(model);

        // Clears
        ctx.select('note');
        ctx.reset();
      },
    },
  ],

  when: ctx => ctx.getSurfaceModelsByType(EmbedHtmlModel).length === 1,
} as const satisfies ToolbarModuleConfig;

const builtinSurfaceToolbarConfig = {
  actions: [
    openDocAction,
    {
      ...captionAction,
      id: 'b.caption',
    },
  ],
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
