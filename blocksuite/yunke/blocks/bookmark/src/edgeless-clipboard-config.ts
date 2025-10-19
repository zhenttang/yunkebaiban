import { EdgelessClipboardConfig } from '@blocksuite/yunke-block-surface';
import { type BlockSnapshot } from '@blocksuite/store';

export class EdgelessClipboardBookmarkConfig extends EdgelessClipboardConfig {
  static override readonly key = 'yunke:bookmark';

  override createBlock(bookmark: BlockSnapshot): string | null {
    if (!this.surface) return null;

    const { xywh, style, url, caption, description, icon, image, title } =
      bookmark.props;

    const bookmarkId = this.crud.addBlock(
      'yunke:bookmark',
      {
        xywh,
        style,
        url,
        caption,
        description,
        icon,
        image,
        title,
      },
      this.surface.model.id
    );
    return bookmarkId;
  }
}
