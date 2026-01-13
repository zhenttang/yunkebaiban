import { WithDisposable } from '@blocksuite/yunke/global/lit';
import { NotificationProvider } from '@blocksuite/yunke/shared/services';
import { unsafeCSSVarV2 } from '@blocksuite/yunke/shared/theme';
import type { EditorHost } from '@blocksuite/yunke/std';
import { ShadowlessElement } from '@blocksuite/yunke/std';
import type { Store } from '@blocksuite/yunke/store';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { ChatContextValue } from '../../chat-panel/chat-context';
import { AIProvider } from '../../provider';

export class AIHistoryClear extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  accessor chatContextValue!: ChatContextValue;

  @property({ attribute: false })
  accessor getSessionId!: () => Promise<string | undefined>;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor doc!: Store;

  @property({ attribute: false })
  accessor onHistoryCleared!: () => void;

  static override styles = css`
    .chat-history-clear {
      cursor: pointer;
      color: ${unsafeCSSVarV2('icon/primary')};
    }
    .chat-history-clear[aria-disabled='true'] {
      cursor: not-allowed;
      color: ${unsafeCSSVarV2('icon/secondary')};
    }
  `;

  private get _isHistoryClearDisabled() {
    return (
      this.chatContextValue.status === 'loading' ||
      this.chatContextValue.status === 'transmitting' ||
      !this.chatContextValue.messages.length
    );
  }

  private readonly _cleanupHistories = async () => {
    if (this._isHistoryClearDisabled) {
      return;
    }
    const sessionId = await this.getSessionId();
    const notification = this.host.std.getOptional(NotificationProvider);
    if (!notification) return;
    try {
      if (
        await notification.confirm({
          title: '清除历史记录',
          message:
            '您确定要清除所有历史记录吗？此操作将永久删除所有内容，包括所有聊天记录和数据，且无法撤销。',
          confirmText: '确认',
          cancelText: '取消',
        })
      ) {
        const actionIds = this.chatContextValue.messages
          .filter(item => 'sessionId' in item)
          .map(item => item.sessionId);
        await AIProvider.histories?.cleanup(
          this.doc.workspace.id,
          this.doc.id,
          [...(sessionId ? [sessionId] : []), ...(actionIds || [])]
        );
        notification.toast('历史记录已清除');
        this.onHistoryCleared?.();
      }
    } catch {
      notification.toast('清除历史记录失败');
    }
  };

  override render() {
    return html`
      <div
        class="chat-history-clear"
        aria-disabled=${this._isHistoryClearDisabled}
        @click=${this._cleanupHistories}
        data-testid="chat-panel-clear"
      >
        清除
      </div>
    `;
  }
}
