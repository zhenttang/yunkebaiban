import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

export type SurfaceRefProps = {
  reference: string;
  caption: string;
  refFlavour: string;
};

export const SurfaceRefBlockSchema = defineBlockSchema({
  flavour: 'yunke:surface-ref',
  props: () => ({
    reference: '',
    caption: '',
    refFlavour: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['yunke:note', 'yunke:paragraph', 'yunke:list'],
  },
  toModel: () => new SurfaceRefBlockModel(),
});

export const SurfaceRefBlockSchemaExtension = BlockSchemaExtension(
  SurfaceRefBlockSchema
);

export class SurfaceRefBlockModel extends BlockModel<SurfaceRefProps> {}
