import { EditorChevronDown } from '@blocksuite/yunke-components/toolbar';
import { NoteDisplayMode } from '@blocksuite/yunke-model';
import { ShadowlessElement } from '@blocksuite/std';
import { html } from 'lit';
import { property } from 'lit/decorators.js';

const DisplayModeMap = {
  [NoteDisplayMode.DocAndEdgeless]: '两者',
  [NoteDisplayMode.EdgelessOnly]: '无边界',
  [NoteDisplayMode.DocOnly]: '页面',
} as const satisfies Record<NoteDisplayMode, string>;

export class EdgelessNoteDisplayModeDropdownMenu extends ShadowlessElement {
  get mode() {
    return DisplayModeMap[this.displayMode];
  }

  select(detail: NoteDisplayMode) {
    this.dispatchEvent(new CustomEvent('select', { detail }));
  }

  override render() {
    const { displayMode, mode } = this;

    return html`
      <span class="display-mode-button-label">显示在</span>
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button
            aria-label="模式"
            .tooltip="${'显示模式'}"
            .justify="${'space-between'}"
            .labelHeight="${'20px'}"
          >
            <span class="label">${mode}</span>
            ${EditorChevronDown}
          </editor-icon-button>
        `}
      >
        <note-display-mode-panel
          .displayMode=${displayMode}
          .onSelect=${(newMode: NoteDisplayMode) => this.select(newMode)}
        >
        </note-display-mode-panel>
      </editor-menu-button>
    `;
  }

  @property({ attribute: false })
  accessor displayMode!: NoteDisplayMode;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-display-mode-dropdown-menu': EdgelessNoteDisplayModeDropdownMenu;
  }
}
