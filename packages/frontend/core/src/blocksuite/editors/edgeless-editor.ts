import { SignalWatcher, WithDisposable } from '@blocksuite/yunke/global/lit';
import { ThemeProvider } from '@blocksuite/yunke/shared/services';
import { BlockStdScope, ShadowlessElement } from '@blocksuite/yunke/std';
import type { ExtensionType, Store } from '@blocksuite/yunke/store';
import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { guard } from 'lit/directives/guard.js';

export class EdgelessEditor extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    edgeless-editor {
      font-family: var(--yunke-font-family);
      background: var(--yunke-background-primary-color);
    }

    edgeless-editor * {
      box-sizing: border-box;
    }

    @media print {
      edgeless-editor {
        height: auto;
      }
    }

    .yunke-edgeless-viewport {
      display: block;
      height: 100%;
      position: relative;
      overflow: clip;
      container-name: viewport;
      container-type: inline-size;
    }
  `;

  get host() {
    try {
      return this.std.host;
    } catch {
      return null;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.doc.slots.rootAdded.subscribe(() => this.requestUpdate())
    );
    this.std = new BlockStdScope({
      store: this.doc,
      extensions: this.specs,
    });
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.host?.updateComplete;
    return result;
  }

  override render() {
    if (!this.doc.root) return nothing;

    const std = this.std;
    const theme = std.get(ThemeProvider).edgeless$.value;

    performance.mark('edgeless-render-start');
    const result = html`
      <div class="yunke-edgeless-viewport" data-theme=${theme}>
        ${guard([std], () => {
          performance.mark('std-render-start');
          const rendered = std.render();
          performance.mark('std-render-end');
          performance.measure('std-render', 'std-render-start', 'std-render-end');
          return rendered;
        })}
      </div>
    `;
    performance.mark('edgeless-render-end');
    performance.measure('edgeless-render', 'edgeless-render-start', 'edgeless-render-end');

    return result;
  }

  override willUpdate(
    changedProperties: Map<string | number | symbol, unknown>
  ) {
    super.willUpdate(changedProperties);
    if (
      this.hasUpdated &&
      changedProperties.has('doc')
    ) {
      console.warn('⚠️ [Performance] EdgelessEditor.std 重建 - doc 变化');
      performance.mark('std-rebuild-start');
      this.std = new BlockStdScope({
        store: this.doc,
        extensions: this.specs,
      });
      performance.mark('std-rebuild-end');
      performance.measure('std-rebuild', 'std-rebuild-start', 'std-rebuild-end');
    }
  }

  @property({ attribute: false })
  accessor doc!: Store;

  @property({ attribute: false })
  accessor editor!: TemplateResult;

  @property({ attribute: false })
  accessor specs: ExtensionType[] = [];

  @state()
  accessor std!: BlockStdScope;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-editor': EdgelessEditor;
  }
}
