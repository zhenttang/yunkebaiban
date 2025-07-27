import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

import type { BlockMeta } from '@blocksuite/affine-model';

export type DrawioBlockProps = {
  src?: string;
  title?: string;
  size?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  attachmentId?: string;
  caption?: string;
} & BlockMeta;

export const DrawioBlockSchema = defineBlockSchema({
  flavour: 'affine:drawio',
  props: () =>
    ({
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
    }) as DrawioBlockProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:paragraph',
      'affine:list',
      'affine:edgeless-text',
    ],
    children: [],
  },
  toModel: () => new DrawioBlockModel(),
});

export const DrawioBlockSchemaExtension = BlockSchemaExtension(DrawioBlockSchema);

export class DrawioBlockModel extends BlockModel<DrawioBlockProps> {}