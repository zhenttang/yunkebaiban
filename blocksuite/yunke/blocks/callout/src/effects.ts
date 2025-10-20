import { CalloutBlockComponent } from './callout-block';
import { EmojiMenu } from './emoji-menu';

export function effects() {
  customElements.define('yunke-callout', CalloutBlockComponent);
  customElements.define('yunke-emoji-menu', EmojiMenu);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-callout': CalloutBlockComponent;
    'yunke-emoji-menu': EmojiMenu;
  }
}
