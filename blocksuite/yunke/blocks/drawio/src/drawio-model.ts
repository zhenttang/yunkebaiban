import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

import type { BlockMeta } from '@blocksuite/yunke-model';

export type DrawioBlockProps = {
  src?: string;
  title?: string;
  size?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  attachmentId?: string;
  caption?: string;
  xml?: string; // 保存原始Draw.io XML数据
} & BlockMeta;

export const DrawioBlockSchema = defineBlockSchema({
  flavour: 'yunke:drawio',
  props: () =>
    ({
      src: '',
      title: '',
      size: 0,
      width: '100%',
      align: 'center',
      attachmentId: '',
      caption: '',
      xml: '', // 添加xml属性
      'meta:createdAt': undefined,
      'meta:createdBy': undefined,
      'meta:updatedAt': undefined,
      'meta:updatedBy': undefined,
    }) as DrawioBlockProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'yunke:note',
      'yunke:paragraph',
      'yunke:list',
      'yunke:edgeless-text',
    ],
    children: [],
  },
  toModel: () => new DrawioBlockModel(),
});

export const DrawioBlockSchemaExtension = BlockSchemaExtension(DrawioBlockSchema);

export class DrawioBlockModel extends BlockModel<DrawioBlockProps> {}