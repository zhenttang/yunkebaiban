import type { FrameBlockModel } from '@blocksuite/yunke/model';
import type { Store } from '@blocksuite/yunke/store';

export function getFrameBlock(doc: Store) {
  const blocks = doc.getBlocksByFlavour('yunke:frame');
  return blocks.length !== 0 ? (blocks[0].model as FrameBlockModel) : null;
}
