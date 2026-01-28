import { EdgelessEmojiToolButton } from './toolbar/emoji-tool-button';
import { EmojiReactionWidget, FloatingEmoji } from './emoji-reaction-widget';

export function effects() {
    if (!customElements.get('edgeless-emoji-tool-button')) {
        customElements.define('edgeless-emoji-tool-button', EdgelessEmojiToolButton);
    }
    if (!customElements.get('emoji-reaction-widget')) {
        customElements.define('emoji-reaction-widget', EmojiReactionWidget);
    }
    if (!customElements.get('floating-emoji')) {
        customElements.define('floating-emoji', FloatingEmoji);
    }
}

// 自动执行以注册自定义元素
effects();

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-emoji-tool-button': EdgelessEmojiToolButton;
        'emoji-reaction-widget': EmojiReactionWidget;
        'floating-emoji': FloatingEmoji;
    }
}
