import { EdgelessClipboardConfig } from '@blocksuite/yunke-block-surface';
import { type BlockSnapshot } from '@blocksuite/store';

export class EdgelessClipboardEdgelessTextConfig extends EdgelessClipboardConfig {
  static override readonly key = 'yunke:edgeless-text';

  override async createBlock(
    edgelessText: BlockSnapshot
  ): Promise<string | null> {
    const oldId = edgelessText.id;
    delete edgelessText.props.index;
    if (!edgelessText.props.xywh) {
      console.error(
        `EdgelessText block(id: ${oldId}) does not have xywh property`
      );
      return null;
    }
    if (!this.surface) {
      return null;
    }
    const newId = await this.onBlockSnapshotPaste(
      edgelessText,
      this.std.store,
      this.surface.model.id
    );
    if (!newId) {
      console.error(`Failed to paste EdgelessText block(id: ${oldId})`);
      return null;
    }

    return newId;
  }
}
