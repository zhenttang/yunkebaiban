import { EdgelessClipboardConfig } from '@blocksuite/yunke-block-surface';
import { type BlockSnapshot } from '@blocksuite/store';

export class EdgelessClipboardAttachmentConfig extends EdgelessClipboardConfig {
  static override readonly key = 'yunke:attachment';

  override async createBlock(
    attachment: BlockSnapshot
  ): Promise<string | null> {
    if (!this.surface) return null;

    const { xywh, rotate, sourceId, name, size, type, embed, style } =
      attachment.props;

    if (!(await this.std.workspace.blobSync.get(sourceId as string))) {
      return null;
    }
    const attachmentId = this.crud.addBlock(
      'yunke:attachment',
      {
        xywh,
        rotate,
        sourceId,
        name,
        size,
        type,
        embed,
        style,
      },
      this.surface.model.id
    );
    return attachmentId;
  }
}
