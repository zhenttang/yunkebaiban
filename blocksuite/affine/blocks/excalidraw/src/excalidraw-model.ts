import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

import type { BlockMeta } from '@blocksuite/affine-model';

export type ExcalidrawBlockProps = {
  data?: string; // Excalidraw scene data as JSON string
  src?: string; // URL to the saved image
  title?: string;
  size?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  attachmentId?: string;
  caption?: string;
} & BlockMeta;

export const ExcalidrawBlockSchema = defineBlockSchema({
  flavour: 'affine:excalidraw',
  props: () =>
    ({
      data: '',
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
    }) as ExcalidrawBlockProps,
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
  toModel: () => new ExcalidrawBlockModel(),
});

export const ExcalidrawBlockSchemaExtension = BlockSchemaExtension(ExcalidrawBlockSchema);

export class ExcalidrawBlockModel extends BlockModel<ExcalidrawBlockProps> {}