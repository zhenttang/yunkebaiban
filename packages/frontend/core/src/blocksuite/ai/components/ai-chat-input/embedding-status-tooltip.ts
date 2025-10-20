import { SignalWatcher } from '@blocksuite/yunke/global/lit';
import { unsafeCSSVar } from '@blocksuite/yunke/shared/theme';
import type { EditorHost } from '@blocksuite/yunke/std';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { debounce, noop } from 'lodash-es';

import { AIProvider } from '../../provider/ai-provider';

export class AIChatEmbeddingStatusTooltip extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
    }
    .embedding-status {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      user-select: none;
    }
    .embedding-status-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 500px;
    }
    .check-status {
      padding: 4px;
      cursor: pointer;
      border-radius: 4px;
    }
    .check-status:hover {
      background-color: ${unsafeCSSVar('--yunke-hover-color')};
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @state()
  accessor progressText = '正在加载嵌入状态...';

  override connectedCallback() {
    super.connectedCallback();
    this._updateEmbeddingStatus().catch(noop);
  }

  private async _updateEmbeddingStatus() {
    try {
      const status = await AIProvider.embedding?.getEmbeddingStatus(
        this.host.std.workspace.id
      );
      if (!status) {
        this.progressText = '正在加载嵌入状态...';
        return;
      }
      const completed = status.embedded === status.total;
      if (completed) {
        this.progressText =
          '嵌入已完成。您正在获得最佳结果！';
      } else {
        this.progressText =
          '文件尚未嵌入。嵌入后结果会有所改善。';
      }
      this.requestUpdate();
    } catch {
      this.progressText = '加载嵌入状态失败...';
    }
  }

  private readonly _handleCheckStatusMouseEnter = debounce(
    () => {
      this._updateEmbeddingStatus().catch(noop);
    },
    1000,
    { leading: true }
  );

  override render() {
    return html`
      <div
        class="embedding-status"
        data-testid="ai-chat-embedding-status-tooltip"
      >
        <div class="embedding-status-text">
          嵌入完成后效果更佳。
        </div>
        <div
          class="check-status"
          data-testid="ai-chat-embedding-status-tooltip-check"
          @mouseenter=${this._handleCheckStatusMouseEnter}
        >
          检查状态
          <yunke-tooltip tip-position="top-start"
            >${this.progressText}</yunke-tooltip
          >
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-chat-embedding-status-tooltip': AIChatEmbeddingStatusTooltip;
  }
}
