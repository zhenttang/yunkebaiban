import { EdgelessVoteToolButton } from './toolbar/vote-tool-button';
import { VoteWidget } from './vote-widget';

export function effects() {
    if (!customElements.get('edgeless-vote-tool-button')) {
        customElements.define('edgeless-vote-tool-button', EdgelessVoteToolButton);
    }
    if (!customElements.get('vote-widget')) {
        customElements.define('vote-widget', VoteWidget);
    }
}

// 自动执行以注册自定义元素
effects();

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-vote-tool-button': EdgelessVoteToolButton;
        'vote-widget': VoteWidget;
    }
}
