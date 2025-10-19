import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
  type Text,
} from '@blocksuite/store';

import type { BlockMeta } from '../../utils/types';

export type CalloutProps = {
  emoji: string;
  text: Text;
} & BlockMeta;

export const CalloutBlockSchema = defineBlockSchema({
  flavour: 'yunke:callout',
  props: (internal): CalloutProps => ({
    emoji: '😀',
    text: internal.Text(),
    'meta:createdAt': undefined,
    'meta:updatedAt': undefined,
    'meta:createdBy': undefined,
    'meta:updatedBy': undefined,
  }),
  metadata: {
    version: 1,
    role: 'hub',
    parent: [
      'yunke:note',
      'yunke:database',
      'yunke:paragraph',
      'yunke:list',
      'yunke:edgeless-text',
      'yunke:transcription',
    ],
    children: ['yunke:paragraph', 'yunke:list'],
  },
  toModel: () => new CalloutBlockModel(),
});

export class CalloutBlockModel extends BlockModel<CalloutProps> {}

export const CalloutBlockSchemaExtension =
  BlockSchemaExtension(CalloutBlockSchema);
