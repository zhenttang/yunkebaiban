import type {
  ConnectorElementModel,
  SurfaceElementModelMap,
} from '@blocksuite/yunke-model';
import { DisposableGroup } from '@blocksuite/global/disposable';
import type { SurfaceBlockProps } from '@blocksuite/std/gfx';
import { SurfaceBlockModel as BaseSurfaceModel } from '@blocksuite/std/gfx';
import { BlockSchemaExtension, defineBlockSchema } from '@blocksuite/store';
import * as Y from 'yjs';

import { elementsCtorMap } from './element-model/index.js';
import { surfaceMiddlewareIdentifier } from './extensions/surface-middleware.js';
import { SurfaceBlockTransformer } from './surface-transformer.js';

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'yunke:surface',
  props: (internalPrimitives): SurfaceBlockProps => ({
    elements: internalPrimitives.Boxed(new Y.Map()),
  }),
  metadata: {
    version: 5,
    role: 'hub',
    parent: ['@root'],
    children: [
      'yunke:frame',
      'yunke:image',
      'yunke:bookmark',
      'yunke:attachment',
      'yunke:embed-*',
      'yunke:edgeless-text',
    ],
  },
  transformer: transformerConfigs =>
    new SurfaceBlockTransformer(transformerConfigs),
  toModel: () => new SurfaceBlockModel(),
});

export const SurfaceBlockSchemaExtension =
  BlockSchemaExtension(SurfaceBlockSchema);

export class SurfaceBlockModel extends BaseSurfaceModel {
  private readonly _disposables: DisposableGroup = new DisposableGroup();

  override _init() {
    this._extendElement(elementsCtorMap);
    super._init();
    this.store.provider
      .getAll(surfaceMiddlewareIdentifier)
      .forEach(({ middleware }) => {
        this._disposables.add(middleware(this));
      });
  }

  getConnectors(id: string) {
    const connectors = this.getElementsByType(
      'connector'
    ) as unknown[] as ConnectorElementModel[];

    return connectors.filter(
      connector => connector.source?.id === id || connector.target?.id === id
    );
  }

  override getElementsByType<K extends keyof SurfaceElementModelMap>(
    type: K
  ): SurfaceElementModelMap[K][] {
    return super.getElementsByType(type) as SurfaceElementModelMap[K][];
  }
}
