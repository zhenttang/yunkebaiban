import { SurfaceBlockModel } from '@blocksuite/yunke-block-surface';
import { FileDropConfigExtension } from '@blocksuite/yunke-components/drop-indicator';
import { ImageBlockSchema, MAX_IMAGE_WIDTH } from '@blocksuite/yunke-model';
import { TelemetryProvider } from '@blocksuite/yunke-shared/services';
import {
  isInsideEdgelessEditor,
  matchModels,
} from '@blocksuite/yunke-shared/utils';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';

import { addImages, addSiblingImageBlocks } from './utils.js';

export const ImageDropOption = FileDropConfigExtension({
  flavour: ImageBlockSchema.model.flavour,
  onDrop: ({ files, targetModel, placement, point, std }) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (!imageFiles.length) return false;

    if (targetModel && !matchModels(targetModel, [SurfaceBlockModel])) {
      addSiblingImageBlocks(std, imageFiles, targetModel, placement).catch(
        console.error
      );
      return true;
    }

    if (isInsideEdgelessEditor(std.host)) {
      const gfx = std.get(GfxControllerIdentifier);
      point = gfx.viewport.toViewCoordFromClientCoord(point);
      addImages(std, files, { point, maxWidth: MAX_IMAGE_WIDTH })
        .then(() => {
          std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
            control: 'canvas:drop',
            page: 'whiteboard editor',
            module: 'toolbar',
            segment: 'toolbar',
            type: 'image',
          });
        })
        .catch(console.error);

      return true;
    }

    return false;
  },
});
