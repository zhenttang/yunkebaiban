import { WithDisposable } from '@blocksuite/global/lit';
import { ExpandFullIcon, CollapseIcon } from '@blocksuite/icons/lit';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { CodeBlockComponent } from '../../code-block.js';

export class CollapseButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }
  `;

  @property({ attribute: false })
  accessor blockComponent!: CodeBlockComponent;

  @state()
  private accessor _collapsed = false;

  private _updateState = () => {
    this._collapsed = this.blockComponent.collapsed;
  };

  override connectedCallback() {
    super.connectedCallback();
    this._updateState();
    
    // 监听组件状态变化
    this.disposables.add(
      this.blockComponent.model.propsUpdated.subscribe(() => {
        this._updateState();
      })
    );
  }

  private _toggleCollapse = () => {
    this.blockComponent.toggleCollapse();
    this._updateState();
  };

  override render() {
    const icon = this._collapsed ? ExpandFullIcon() : CollapseIcon();
    const label = this._collapsed ? '展开' : '折叠';

    return html`
      <editor-icon-button
        class="code-toolbar-button collapse"
        aria-label=${label}
        .tooltip=${label}
        .tooltipOffset=${4}
        .iconSize=${'16px'}
        .iconContainerPadding=${4}
        @click=${this._toggleCollapse}
      >
        ${icon}
      </editor-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'collapse-button': CollapseButton;
  }
}