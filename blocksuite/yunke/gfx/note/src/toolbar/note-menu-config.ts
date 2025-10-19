import {
  BulletedListIcon,
  CheckBoxIcon,
  CodeBlockIcon,
  DividerIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  NumberedListIcon,
  QuoteIcon,
  TextIcon,
} from '@blocksuite/yunke-components/icons';
import type { NoteChildrenFlavour } from '@blocksuite/yunke-shared/types';
import type { TemplateResult } from 'lit';

export const BUTTON_GROUP_LENGTH = 10;

export type NoteMenuItem = {
  icon: TemplateResult<1>;
  tooltip: string;
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
};

const LIST_ITEMS = [
  {
    flavour: 'yunke:list',
    type: 'bulleted',
    name: '无序列表',
    description: '创建一个无序列表。',
    icon: BulletedListIcon,
    tooltip: '插入无序列表',
  },
  {
    flavour: 'yunke:list',
    type: 'numbered',
    name: '有序列表',
    description: '创建一个有序列表。',
    icon: NumberedListIcon,
    tooltip: '插入有序列表',
  },
  {
    flavour: 'yunke:list',
    type: 'todo',
    name: '待办清单',
    description: '用待办清单跟踪任务。',
    icon: CheckBoxIcon,
    tooltip: '插入待办清单',
  },
];

const TEXT_ITEMS = [
  {
    flavour: 'yunke:paragraph',
    type: 'text',
    name: '正文',
    description: '从正文开始输入。',
    icon: TextIcon,
    tooltip: '插入正文',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'h1',
    name: '一级标题',
    description: '最大字号的标题。',
    icon: Heading1Icon,
    tooltip: '插入一级标题',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'h2',
    name: '二级标题',
    description: '第二大字号的标题。',
    icon: Heading2Icon,
    tooltip: '插入二级标题',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'h3',
    name: '三级标题',
    description: '第三大字号的标题。',
    icon: Heading3Icon,
    tooltip: '插入三级标题',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'h4',
    name: '四级标题',
    description: '第四大字号的标题。',
    icon: Heading4Icon,
    tooltip: '插入四级标题',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'h5',
    name: '五级标题',
    description: '第五大字号的标题。',
    icon: Heading5Icon,
    tooltip: '插入五级标题',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'h6',
    name: '六级标题',
    description: '第六大字号的标题。',
    icon: Heading6Icon,
    tooltip: '插入六级标题',
  },
  {
    flavour: 'yunke:code',
    type: 'code',
    name: '代码块',
    description: '插入代码片段。',
    icon: CodeBlockIcon,
    tooltip: '插入代码块',
  },
  {
    flavour: 'yunke:paragraph',
    type: 'quote',
    name: '引用',
    description: '插入引用内容。',
    icon: QuoteIcon,
    tooltip: '插入引用',
  },
  {
    flavour: 'yunke:divider',
    type: null,
    name: '分割线',
    description: '视觉分割线。',
    icon: DividerIcon,
    tooltip: '插入分割线',
  },
];

// TODO: add image, bookmark, database blocks
export const NOTE_MENU_ITEMS = TEXT_ITEMS.concat(LIST_ITEMS)
  .filter(item => item.name !== 'Divider')
  .map(item => {
    return {
      icon: item.icon,
      tooltip:
        item.type !== 'text'
          ? item.tooltip.replace('Drag/Click to insert ', '')
          : '文本',
      childFlavour: item.flavour as NoteChildrenFlavour,
      childType: item.type,
    } as NoteMenuItem;
  });
