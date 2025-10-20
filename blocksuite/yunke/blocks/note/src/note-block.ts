import type { NoteBlockModel } from '@blocksuite/yunke-model';
import { BlockComponent } from '@blocksuite/std';
import { css, html } from 'lit';

export class NoteBlockComponent extends BlockComponent<NoteBlockModel> {
  static override styles = css`
    .yunke-note-block-container {
      display: flow-root;
    }
    .yunke-note-block-container.selected {
      background-color: var(--yunke-hover-color);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
  }

  override renderBlock() {
    return html`
      <div class="yunke-note-block-container">
        <div class="yunke-block-children-container">
          ${this.renderChildren(this.model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-note': NoteBlockComponent;
  }
}
