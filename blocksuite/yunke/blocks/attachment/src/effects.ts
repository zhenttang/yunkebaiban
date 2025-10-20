import { AttachmentBlockComponent } from './attachment-block';
import { AttachmentEdgelessBlockComponent } from './attachment-edgeless-block';

export function effects() {
  customElements.define(
    'yunke-edgeless-attachment',
    AttachmentEdgelessBlockComponent
  );
  customElements.define('yunke-attachment', AttachmentBlockComponent);
}
