import { NoteBlockModel, NoteDisplayMode } from '@blocksuite/yunke-model';
import { matchModels } from '@blocksuite/yunke-shared/utils';
import { BlockComponent } from '@blocksuite/std';
import { css, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export class PreviewRootBlockComponent extends BlockComponent {
  static override styles = css`
    yunke-preview-root {
      display: block;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  override renderBlock() {
    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    const children = this.renderChildren(this.model, child => {
      const isNote = matchModels(child, [NoteBlockModel]);
      const note = child as NoteBlockModel;
      const displayOnEdgeless =
        !!note.props.displayMode &&
        note.props.displayMode === NoteDisplayMode.EdgelessOnly;
      // Should remove deprecated `hidden` property in the future
      return !(isNote && displayOnEdgeless);
    });

    return html`<div class="yunke-preview-root">${children} ${widgets}</div>`;
  }
}
