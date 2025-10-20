import type { RootBlockModel } from '@blocksuite/yunke/model';
import { BlockComponent } from '@blocksuite/yunke/std';
import { html } from 'lit';

export class MindmapRootBlock extends BlockComponent<RootBlockModel> {
  override render() {
    return html`
      <style>
        .yunke-mini-mindmap-root {
          display: block;
          width: 100%;
          height: 100%;

          background-size: 20px 20px;
          background-color: var(--yunke-background-primary-color);
          background-image: radial-gradient(
            var(--yunke-edgeless-grid-color) 1px,
            var(--yunke-background-primary-color) 1px
          );
        }
      </style>
      <div class="yunke-mini-mindmap-root">
        ${this.host.renderChildren(this.model)}
      </div>
    `;
  }
}
