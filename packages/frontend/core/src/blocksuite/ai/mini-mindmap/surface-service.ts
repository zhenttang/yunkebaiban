import { SurfaceBlockSchema } from '@blocksuite/yunke/blocks/surface';
import { BlockService } from '@blocksuite/yunke/std';

export class MindmapSurfaceBlockService extends BlockService {
  static override readonly flavour = SurfaceBlockSchema.model.flavour;
}
