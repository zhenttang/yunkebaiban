import { addSiblingAttachmentBlocks } from '@blocksuite/yunke-block-attachment';
import { insertDatabaseBlockCommand } from '@blocksuite/yunke-block-database';
import { insertEmptyEmbedIframeCommand } from '@blocksuite/yunke-block-embed';
import { insertImagesCommand } from '@blocksuite/yunke-block-image';
import { insertLatexBlockCommand } from '@blocksuite/yunke-block-latex';
import {
  canDedentListCommand,
  canIndentListCommand,
  dedentListCommand,
  indentListCommand,
} from '@blocksuite/yunke-block-list';
import { updateBlockType } from '@blocksuite/yunke-block-note';
import {
  canDedentParagraphCommand,
  canIndentParagraphCommand,
  dedentParagraphCommand,
  indentParagraphCommand,
} from '@blocksuite/yunke-block-paragraph';
import { DefaultTool, getSurfaceBlock } from '@blocksuite/yunke-block-surface';
import { insertSurfaceRefBlockCommand } from '@blocksuite/yunke-block-surface-ref';
import { toggleEmbedCardCreateModal } from '@blocksuite/yunke-components/embed-card-modal';
import { toast } from '@blocksuite/yunke-components/toast';
import { insertInlineLatex } from '@blocksuite/yunke-inline-latex';
import { toggleLink } from '@blocksuite/yunke-inline-link';
import {
  formatBlockCommand,
  formatNativeCommand,
  formatTextCommand,
  getTextStyle,
  toggleBold,
  toggleCode,
  toggleItalic,
  toggleStrike,
  toggleUnderline,
} from '@blocksuite/yunke-inline-preset';
import type { FrameBlockModel } from '@blocksuite/yunke-model';
import { insertContent } from '@blocksuite/yunke-rich-text';
import {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  draftSelectedModelsCommand,
  duplicateSelectedModelsCommand,
  getBlockSelectionsCommand,
  getSelectedModelsCommand,
  getTextSelectionCommand,
} from '@blocksuite/yunke-shared/commands';
import { REFERENCE_NODE } from '@blocksuite/yunke-shared/consts';
import type { AffineTextAttributes } from '@blocksuite/yunke-shared/types';
import {
  createDefaultDoc,
  openSingleFileWith,
  type Signal,
} from '@blocksuite/yunke-shared/utils';
import type { AffineLinkedDocWidget } from '@blocksuite/yunke-widget-linked-doc';
import { viewPresets } from '@blocksuite/data-view/view-presets';
import { assertType } from '@blocksuite/global/utils';
import {
  AttachmentIcon,
  BoldIcon,
  BulletedListIcon,
  CheckBoxCheckLinearIcon,
  CloseIcon,
  CodeBlockIcon,
  CodeIcon,
  CollapseTabIcon,
  CopyIcon,
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
  DividerIcon,
  DuplicateIcon,
  EmbedIcon,
  FontIcon,
  FrameIcon,
  GithubIcon,
  GroupIcon,
  ImageIcon,
  ItalicIcon,
  LinkedPageIcon,
  LinkIcon,
  LoomLogoIcon,
  NewPageIcon,
  NowIcon,
  NumberedListIcon,
  PlusIcon,
  QuoteIcon,
  RedoIcon,
  RightTabIcon,
  StrikeThroughIcon,
  TeXIcon,
  TextIcon,
  TodayIcon,
  TomorrowIcon,
  UnderLineIcon,
  UndoIcon,
  YesterdayIcon,
  YoutubeDuotoneIcon,
} from '@blocksuite/icons/lit';
import {
  type BlockComponent,
  type BlockStdScope,
  ConfigExtensionFactory,
} from '@blocksuite/std';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';
import { computed } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import type { TemplateResult } from 'lit';

import {
  FigmaDuotoneIcon,
  HeadingIcon,
  HighLightDuotoneIcon,
  TextBackgroundDuotoneIcon,
  TextColorIcon,
} from './icons.js';
import { formatDate, formatTime } from './utils.js';

export type KeyboardToolbarConfig = {
  items: KeyboardToolbarItem[];
};

export type KeyboardToolbarItem =
  | KeyboardToolbarActionItem
  | KeyboardSubToolbarConfig
  | KeyboardToolPanelConfig;

export type KeyboardIconType =
  | TemplateResult
  | ((ctx: KeyboardToolbarContext) => TemplateResult);

export type KeyboardToolbarActionItem = {
  name: string;
  icon: KeyboardIconType;
  background?: string | ((ctx: KeyboardToolbarContext) => string | undefined);
  /**
   * @default true
   * @description Whether to show the item in the toolbar.
   */
  showWhen?: (ctx: KeyboardToolbarContext) => boolean;
  /**
   * @default false
   * @description Whether to set the item as disabled status.
   */
  disableWhen?: (ctx: KeyboardToolbarContext) => boolean;
  /**
   * @description The action to be executed when the item is clicked.
   */
  action?: (ctx: KeyboardToolbarContext) => void | Promise<void>;
};

export type KeyboardSubToolbarConfig = {
  icon: KeyboardIconType;
  items: KeyboardToolbarItem[];
  /**
   * It will enter this sub-toolbar when the condition is met.
   */
  autoShow?: (ctx: KeyboardToolbarContext) => Signal<boolean>;
};

export type KeyboardToolbarContext = {
  std: BlockStdScope;
  rootComponent: BlockComponent;
  /**
   * Close tool bar, and blur the focus if blur is true, default is false
   */
  closeToolbar: (blur?: boolean) => void;
  /**
   * Close current tool panel and show virtual keyboard
   */
  closeToolPanel: () => void;
};

export type KeyboardToolPanelConfig = {
  icon: KeyboardIconType;
  activeIcon?: KeyboardIconType;
  activeBackground?: string;
  groups: (KeyboardToolPanelGroup | DynamicKeyboardToolPanelGroup)[];
};

export type KeyboardToolPanelGroup = {
  name: string;
  items: KeyboardToolbarActionItem[];
};

export type DynamicKeyboardToolPanelGroup = (
  ctx: KeyboardToolbarContext
) => KeyboardToolPanelGroup | null;

const textToolActionItems: KeyboardToolbarActionItem[] = [
  {
    name: '文本',
    icon: TextIcon(),
    showWhen: ({ std }) =>
      std.store.schema.flavourSchemaMap.has('yunke:paragraph'),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:paragraph',
        props: { type: 'text' },
      });
    },
  },
  ...([1, 2, 3, 4, 5, 6] as const).map(i => ({
    name: `标题 ${i}`,
    icon: HeadingIcon(i),
    showWhen: ({ std }: KeyboardToolbarContext) =>
      std.store.schema.flavourSchemaMap.has('yunke:paragraph'),
    action: ({ std }: KeyboardToolbarContext) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:paragraph',
        props: { type: `h${i}` },
      });
    },
  })),
  {
    name: '代码块',
    showWhen: ({ std }) => std.store.schema.flavourSchemaMap.has('yunke:code'),
    icon: CodeBlockIcon(),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:code',
      });
    },
  },
  {
    name: '引用',
    showWhen: ({ std }) =>
      std.store.schema.flavourSchemaMap.has('yunke:paragraph'),
    icon: QuoteIcon(),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:paragraph',
        props: { type: 'quote' },
      });
    },
  },
  {
    name: '分割线',
    icon: DividerIcon(),
    showWhen: ({ std }) =>
      std.store.schema.flavourSchemaMap.has('yunke:divider'),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:divider',
        props: { type: 'divider' },
      });
    },
  },
  {
    name: '内联公式',
    icon: TeXIcon(),
    showWhen: ({ std }) =>
      std.store.schema.flavourSchemaMap.has('yunke:paragraph'),
    action: ({ std }) => {
      std.command
        .chain()
        .pipe(getTextSelectionCommand)
        .pipe(insertInlineLatex)
        .run();
    },
  },
];

const listToolActionItems: KeyboardToolbarActionItem[] = [
  {
    name: '无序列表',
    icon: BulletedListIcon(),
    showWhen: ({ std }) => std.store.schema.flavourSchemaMap.has('yunke:list'),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:list',
        props: {
          type: 'bulleted',
        },
      });
    },
  },
  {
    name: '有序列表',
    icon: NumberedListIcon(),
    showWhen: ({ std }) => std.store.schema.flavourSchemaMap.has('yunke:list'),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:list',
        props: {
          type: 'numbered',
        },
      });
    },
  },
  {
    name: '复选框',
    icon: CheckBoxCheckLinearIcon(),
    showWhen: ({ std }) => std.store.schema.flavourSchemaMap.has('yunke:list'),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour: 'yunke:list',
        props: {
          type: 'todo',
        },
      });
    },
  },
];

const pageToolGroup: KeyboardToolPanelGroup = {
  name: '页面',
  items: [
    {
      name: '新页面',
      icon: NewPageIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:embed-linked-doc'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(({ selectedModels }) => {
            const newDoc = createDefaultDoc(std.store.workspace);
            if (!selectedModels?.length) return;
            insertContent(std, selectedModels[0], REFERENCE_NODE, {
              reference: {
                type: 'LinkedPage',
                pageId: newDoc.id,
              },
            });
          })
          .run();
      },
    },
    {
      name: '链接页面',
      icon: LinkedPageIcon(),
      showWhen: ({ std, rootComponent }) => {
        const linkedDocWidget = std.view.getWidget(
          'affine-linked-doc-widget',
          rootComponent.model.id
        );
        if (!linkedDocWidget) return false;

        return std.store.schema.flavourSchemaMap.has('yunke:embed-linked-doc');
      },
      action: ({ rootComponent, closeToolPanel }) => {
        const { std } = rootComponent;

        const linkedDocWidget = std.view.getWidget(
          'affine-linked-doc-widget',
          rootComponent.model.id
        );
        if (!linkedDocWidget) return;
        assertType<AffineLinkedDocWidget>(linkedDocWidget);
        linkedDocWidget.show({
          mode: 'mobile',
          addTriggerKey: true,
        });
        closeToolPanel();
      },
    },
  ],
};

const contentMediaToolGroup: KeyboardToolPanelGroup = {
  name: '内容与媒体',
  items: [
    {
      name: '图片',
      icon: ImageIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:image'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertImagesCommand, { removeEmptyLine: true })
          .run();
      },
    },
    {
      name: '链接',
      icon: LinkIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:bookmark'),
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.store.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'Links',
          'The added link will be displayed as a card view.',
          { mode: 'page', parentModel, index },
          ({ mode }) => {
            if (mode === 'edgeless') {
              const gfx = std.get(GfxControllerIdentifier);
              gfx.tool.setTool(DefaultTool);
            }
          }
        );
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: '附件',
      icon: AttachmentIcon(),
      showWhen: () => false,
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const file = await openSingleFileWith();
        if (!file) return;

        await addSiblingAttachmentBlocks(std, [file], model);
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: '公式',
      icon: TeXIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:latex'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertLatexBlockCommand, {
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
  ],
};

const embedToolGroup: KeyboardToolPanelGroup = {
  name: '嵌入',
  items: [
    {
      name: '嵌入',
      icon: EmbedIcon({ style: `color: black` }),
      showWhen: ({ std }) => {
        return std.store.schema.flavourSchemaMap.has('yunke:embed-iframe');
      },
      action: async ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertEmptyEmbedIframeCommand, {
            place: 'after',
            removeEmptyLine: true,
            linkInputPopupOptions: {
              showCloseButton: true,
              variant: 'mobile',
              telemetrySegment: 'keyboard toolbar',
            },
          })
          .run();
      },
    },
    {
      name: 'YouTube',
      icon: YoutubeDuotoneIcon({
        style: `color: white`,
      }),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:embed-youtube'),
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.store.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'YouTube',
          '添加的YouTube视频链接将以嵌入视图显示。',
          { mode: 'page', parentModel, index },
          ({ mode }) => {
            if (mode === 'edgeless') {
              const gfx = std.get(GfxControllerIdentifier);
              gfx.tool.setTool(DefaultTool);
            }
          }
        );
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: 'GitHub',
      icon: GithubIcon({ style: `color: black` }),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:embed-github'),
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.store.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'GitHub',
          'The added GitHub issue or pull request link will be displayed as a card view.',
          { mode: 'page', parentModel, index },
          ({ mode }) => {
            if (mode === 'edgeless') {
              const gfx = std.get(GfxControllerIdentifier);
              gfx.tool.setTool(DefaultTool);
            }
          }
        );
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: 'Figma',
      icon: FigmaDuotoneIcon,
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:embed-figma'),
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.store.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'Figma',
          '添加的Figma链接将以嵌入视图显示。',
          { mode: 'page', parentModel, index },
          ({ mode }) => {
            if (mode === 'edgeless') {
              const gfx = std.get(GfxControllerIdentifier);
              gfx.tool.setTool(DefaultTool);
            }
          }
        );
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: 'Loom',
      icon: LoomLogoIcon({ style: `color: #625DF5` }),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:embed-loom'),
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.store.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'Loom',
          '添加的Loom视频链接将以嵌入视图显示。',
          { mode: 'page', parentModel, index },
          ({ mode }) => {
            if (mode === 'edgeless') {
              const gfx = std.get(GfxControllerIdentifier);
              gfx.tool.setTool(DefaultTool);
            }
          }
        );
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: '数学公式',
      icon: TeXIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:latex'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertLatexBlockCommand, {
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
  ],
};

const documentGroupFrameToolGroup: DynamicKeyboardToolPanelGroup = ({
  std,
}) => {
  const { store } = std;

  const frameModels = store
    .getBlocksByFlavour('yunke:frame')
    .map(block => block.model) as FrameBlockModel[];

  const frameItems = frameModels.map<KeyboardToolbarActionItem>(frameModel => ({
    name: '画框: ' + frameModel.props.title.toString(),
    icon: FrameIcon(),
    action: ({ std }) => {
      std.command
        .chain()
        .pipe(getSelectedModelsCommand)
        .pipe(insertSurfaceRefBlockCommand, {
          reference: frameModel.id,
          place: 'after',
          removeEmptyLine: true,
        })
        .run();
    },
  }));

  const surfaceModel = getSurfaceBlock(store);

  const groupElements = surfaceModel
    ? surfaceModel.getElementsByType('group')
    : [];

  const groupItems = groupElements.map<KeyboardToolbarActionItem>(group => ({
    name: '分组: ' + group.title.toString(),
    icon: GroupIcon(),
    action: ({ std }) => {
      std.command
        .chain()
        .pipe(getSelectedModelsCommand)
        .pipe(insertSurfaceRefBlockCommand, {
          reference: group.id,
          place: 'after',
          removeEmptyLine: true,
        })
        .run();
    },
  }));

  const items = [...frameItems, ...groupItems];

  if (items.length === 0) return null;

  return {
    name: '文档分组和画框',
    items,
  };
};

const dateToolGroup: KeyboardToolPanelGroup = {
  name: '日期',
  items: [
    {
      name: '今天',
      icon: TodayIcon(),
      action: ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        insertContent(std, model, formatDate(new Date()));
      },
    },
    {
      name: '明天',
      icon: TomorrowIcon(),
      action: ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        insertContent(std, model, formatDate(tomorrow));
      },
    },
    {
      name: '昨天',
      icon: YesterdayIcon(),
      action: ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        insertContent(std, model, formatDate(yesterday));
      },
    },
    {
      name: '现在',
      icon: NowIcon(),
      action: ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        insertContent(std, model, formatTime(new Date()));
      },
    },
  ],
};

const databaseToolGroup: KeyboardToolPanelGroup = {
  name: '数据库',
  items: [
    {
      name: '表格视图',
      icon: DatabaseTableViewIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:database'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.tableViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
    {
      name: '看板视图',
      icon: DatabaseKanbanViewIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:database'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.kanbanViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
  ],
};

const moreToolPanel: KeyboardToolPanelConfig = {
  icon: PlusIcon(),
  activeIcon: CloseIcon({
    style: `color: ${cssVarV2('icon/activated')}`,
  }),
  activeBackground: cssVarV2('edgeless/selection/selectionMarqueeBackground'),
  groups: [
    { name: '基本', items: textToolActionItems },
    { name: '列表', items: listToolActionItems },
    pageToolGroup,
    contentMediaToolGroup,
    embedToolGroup,
    documentGroupFrameToolGroup,
    dateToolGroup,
    databaseToolGroup,
  ],
};

const textToolPanel: KeyboardToolPanelConfig = {
  icon: TextIcon(),
  groups: [
    {
      name: '转换为',
      items: textToolActionItems,
    },
  ],
};

const textStyleToolItems: KeyboardToolbarItem[] = [
  {
    name: '粗体',
    icon: BoldIcon(),
    background: ({ std }) => {
      const [_, { textStyle }] = std.command.exec(getTextStyle);
      return textStyle?.bold ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec(toggleBold);
    },
  },
  {
    name: '斜体',
    icon: ItalicIcon(),
    background: ({ std }) => {
      const [_, { textStyle }] = std.command.exec(getTextStyle);
      return textStyle?.italic ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec(toggleItalic);
    },
  },
  {
    name: '下划线',
    icon: UnderLineIcon(),
    background: ({ std }) => {
      const [_, { textStyle }] = std.command.exec(getTextStyle);
      return textStyle?.underline ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec(toggleUnderline);
    },
  },
  {
    name: '删除线',
    icon: StrikeThroughIcon(),
    background: ({ std }) => {
      const [_, { textStyle }] = std.command.exec(getTextStyle);
      return textStyle?.strike ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec(toggleStrike);
    },
  },
  {
    name: '代码',
    icon: CodeIcon(),
    background: ({ std }) => {
      const [_, { textStyle }] = std.command.exec(getTextStyle);
      return textStyle?.code ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec(toggleCode);
    },
  },
  {
    name: '链接',
    icon: LinkIcon(),
    background: ({ std }) => {
      const [_, { textStyle }] = std.command.exec(getTextStyle);
      return textStyle?.link ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec(toggleLink);
    },
  },
];

const highlightToolPanel: KeyboardToolPanelConfig = {
  icon: ({ std }) => {
    const [_, { textStyle }] = std.command.exec(getTextStyle);
    if (textStyle?.color) {
      return HighLightDuotoneIcon(textStyle.color);
    } else {
      return HighLightDuotoneIcon(cssVarV2('icon/primary'));
    }
  },
  groups: [
    {
      name: '颜色',
      items: [
        {
          name: '默认颜色',
          icon: TextColorIcon(cssVarV2('text/highlight/fg/orange')),
        },
        ...(
          [
            'red',
            'orange',
            'yellow',
            'green',
            'teal',
            'blue',
            'purple',
            'grey',
          ] as const
        ).map<KeyboardToolbarActionItem>(color => ({
          name: color === 'red' ? '红色' :
                color === 'orange' ? '橙色' :
                color === 'yellow' ? '黄色' :
                color === 'green' ? '绿色' :
                color === 'teal' ? '青色' :
                color === 'blue' ? '蓝色' :
                color === 'purple' ? '紫色' :
                '灰色',
          icon: TextColorIcon(cssVarV2(`text/highlight/fg/${color}`)),
          action: ({ std }) => {
            const payload = {
              styles: {
                color: cssVarV2(`text/highlight/fg/${color}`),
              } satisfies AffineTextAttributes,
            };
            std.command
              .chain()
              .try(chain => [
                chain
                  .pipe(getTextSelectionCommand)
                  .pipe(formatTextCommand, payload),
                chain
                  .pipe(getBlockSelectionsCommand)
                  .pipe(formatBlockCommand, payload),
                chain.pipe(formatNativeCommand, payload),
              ])
              .run();
          },
        })),
      ],
    },
    {
      name: '背景',
      items: [
        {
          name: '默认颜色',
          icon: TextBackgroundDuotoneIcon(cssVarV2('text/highlight/bg/orange')),
        },
        ...(
          [
            'red',
            'orange',
            'yellow',
            'green',
            'teal',
            'blue',
            'purple',
            'grey',
          ] as const
        ).map<KeyboardToolbarActionItem>(color => ({
          name: color === 'red' ? '红色' :
                color === 'orange' ? '橙色' :
                color === 'yellow' ? '黄色' :
                color === 'green' ? '绿色' :
                color === 'teal' ? '青色' :
                color === 'blue' ? '蓝色' :
                color === 'purple' ? '紫色' :
                '灰色',
          icon: TextBackgroundDuotoneIcon(
            cssVarV2(`text/highlight/bg/${color}`)
          ),
          action: ({ std }) => {
            const payload = {
              styles: {
                background: cssVarV2(`text/highlight/bg/${color}`),
              } satisfies AffineTextAttributes,
            };
            std.command
              .chain()
              .try(chain => [
                chain
                  .pipe(getTextSelectionCommand)
                  .pipe(formatTextCommand, payload),
                chain
                  .pipe(getBlockSelectionsCommand)
                  .pipe(formatBlockCommand, payload),
                chain.pipe(formatNativeCommand, payload),
              ])
              .run();
          },
        })),
      ],
    },
  ],
};

const textSubToolbarConfig: KeyboardSubToolbarConfig = {
  icon: FontIcon(),
  items: [
    textToolPanel,
    ...textStyleToolItems,
    {
      name: '内联公式',
      icon: TeXIcon(),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getTextSelectionCommand)
          .pipe(insertInlineLatex)
          .run();
      },
    },
    highlightToolPanel,
  ],
  autoShow: ({ std }) => {
    return computed(() => {
      const [_, { currentTextSelection: selection }] = std.command.exec(
        getTextSelectionCommand
      );
      return selection ? !selection.isCollapsed() : false;
    });
  },
};

export const defaultKeyboardToolbarConfig: KeyboardToolbarConfig = {
  items: [
    moreToolPanel,
    // TODO(@L-Sun): add ai function in AFFiNE side
    // { icon: AiIcon(iconStyle) },
    textSubToolbarConfig,
    {
      name: '图片',
      icon: ImageIcon(),
      showWhen: ({ std }) =>
        std.store.schema.flavourSchemaMap.has('yunke:image'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertImagesCommand, { removeEmptyLine: true })
          .run();
      },
    },
    {
      name: '附件',
      icon: AttachmentIcon(),
      showWhen: () => false,
      action: async ({ std }) => {
        const [_, { selectedModels }] = std.command.exec(
          getSelectedModelsCommand
        );
        const model = selectedModels?.[0];
        if (!model) return;

        const file = await openSingleFileWith();
        if (!file) return;

        await addSiblingAttachmentBlocks(std, [file], model);
        if (model.text?.length === 0) {
          std.store.deleteBlock(model);
        }
      },
    },
    {
      name: '撤销',
      icon: UndoIcon(),
      disableWhen: ({ std }) => !std.store.canUndo,
      action: ({ std }) => {
        std.store.undo();
      },
    },
    {
      name: '重做',
      icon: RedoIcon(),
      disableWhen: ({ std }) => !std.store.canRedo,
      action: ({ std }) => {
        std.store.redo();
      },
    },
    {
      name: '右缩进',
      icon: RightTabIcon(),
      disableWhen: ({ std }) => {
        const [success] = std.command
          .chain()
          .tryAll(chain => [
            chain.pipe(canIndentParagraphCommand),
            chain.pipe(canIndentListCommand),
          ])
          .run();
        return !success;
      },
      action: ({ std }) => {
        std.command
          .chain()
          .tryAll(chain => [
            chain.pipe(canIndentParagraphCommand).pipe(indentParagraphCommand),
            chain.pipe(canIndentListCommand).pipe(indentListCommand),
          ])
          .run();
      },
    },
    ...listToolActionItems,
    ...textToolActionItems.filter(({ name }) => name === 'Divider'),
    {
      name: '左缩进',
      icon: CollapseTabIcon(),
      disableWhen: ({ std }) => {
        const [success] = std.command
          .chain()
          .tryAll(chain => [
            chain.pipe(canDedentParagraphCommand),
            chain.pipe(canDedentListCommand),
          ])
          .run();
        return !success;
      },
      action: ({ std }) => {
        std.command
          .chain()
          .tryAll(chain => [
            chain.pipe(canDedentParagraphCommand).pipe(dedentParagraphCommand),
            chain.pipe(canDedentListCommand).pipe(dedentListCommand),
          ])
          .run();
      },
    },
    {
      name: '复制',
      icon: CopyIcon(),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .with({
            onCopy: () => {
              toast(std.host, '已复制到剪贴板');
            },
          })
          .pipe(draftSelectedModelsCommand)
          .pipe(copySelectedModelsCommand)
          .run();
      },
    },
    {
      name: '复制',
      icon: DuplicateIcon(),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(duplicateSelectedModelsCommand)
          .run();
      },
    },
    {
      name: '删除',
      icon: DeleteIcon(),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(deleteSelectedModelsCommand)
          .run();
      },
    },
  ],
};

export const KeyboardToolbarConfigExtension = ConfigExtensionFactory<
  Partial<KeyboardToolbarConfig>
>('yunke:keyboard-toolbar');
