import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

import type { BlockMeta } from '../../utils/types.js';

export type DrawioBlockProps = {
  src?: string;
  title?: string;
  size?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  attachmentId?: string;
  caption?: string;
} & BlockMeta;

const defaultDrawioProps: DrawioBlockProps = {
  src: '',
  title: '',
  size: 0,
  width: '100%',
  align: 'center',
  attachmentId: '',
  caption: '',
  'meta:createdAt': undefined,
  'meta:createdBy': undefined,
  'meta:updatedAt': undefined,
  'meta:updatedBy': undefined,
};

export const DrawioBlockSchema = defineBlockSchema({
  flavour: 'yunke:drawio',
  props: () => defaultDrawioProps,
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