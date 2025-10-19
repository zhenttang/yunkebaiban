import { EdgelessClipboardConfig } from '@blocksuite/yunke-block-surface';
import { ReferenceInfoSchema } from '@blocksuite/yunke-model';
import { type BlockSnapshot } from '@blocksuite/store';

export class EdgelessClipboardEmbedLinkedDocConfig extends EdgelessClipboardConfig {
  static override readonly key = 'yunke:embed-linked-doc';

  override createBlock(linkedDocEmbed: BlockSnapshot): string | null {
    if (!this.surface) return null;

    const { xywh, style, caption, pageId, params, title, description } =
      linkedDocEmbed.props;
    const referenceInfo = ReferenceInfoSchema.parse({
      pageId,
      params,
      title,
      description,
    });

    return this.crud.addBlock(
      'yunke:embed-linked-doc',
      {
        xywh,
        style,
        caption,
        ...referenceInfo,
      },
      this.surface.model.id
    );
  }
}
