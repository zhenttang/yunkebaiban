import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
  type Text,
} from '@blocksuite/store';

import type { BlockMeta } from '@blocksuite/yunke-model';

export type MermaidBlockProps = {
  text: Text;
  caption?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
} & BlockMeta;

export const MermaidBlockSchema = defineBlockSchema({
  flavour: 'yunke:mermaid',
  props: internal =>
    ({
      text: internal.Text(),
      caption: '',
      width: '100%',
      align: 'center',
      'meta:createdAt': undefined,
      'meta:createdBy': undefined,
      'meta:updatedAt': undefined,
      'meta:updatedBy': undefined,
    }) as MermaidBlockProps,
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
  toModel: () => new MermaidBlockModel(),
});

export const MermaidBlockSchemaExtension = BlockSchemaExtension(MermaidBlockSchema);

export class MermaidBlockModel extends BlockModel<MermaidBlockProps> {}