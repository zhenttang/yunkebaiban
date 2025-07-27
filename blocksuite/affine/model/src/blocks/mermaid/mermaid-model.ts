import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
  Text,
} from '@blocksuite/store';

import type { BlockMeta } from '../../utils/types.js';

export type MermaidBlockProps = {
  text: Text;
  caption?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
} & BlockMeta;

const defaultMermaidProps: MermaidBlockProps = {
  text: new Text(),
  caption: '',
  width: '100%',
  align: 'center',
  'meta:createdAt': undefined,
  'meta:createdBy': undefined,
  'meta:updatedAt': undefined,
  'meta:updatedBy': undefined,
};

export const MermaidBlockSchema = defineBlockSchema({
  flavour: 'affine:mermaid',
  props: () => defaultMermaidProps,
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
  toModel: () => new MermaidBlockModel(),
});

export const MermaidBlockSchemaExtension = BlockSchemaExtension(MermaidBlockSchema);

export class MermaidBlockModel extends BlockModel<MermaidBlockProps> {}