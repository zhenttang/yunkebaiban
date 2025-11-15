import { CalloutBlockComponent } from './callout-block';
import { CalloutColorPicker } from './color-picker';
import { EmojiMenu } from './emoji-menu';
import { CalloutSizePicker } from './size-picker';

export function effects() {
  customElements.define('yunke-callout', CalloutBlockComponent);
  customElements.define('yunke-emoji-menu', EmojiMenu);
  customElements.define('yunke-callout-color-picker', CalloutColorPicker);
  customElements.define('yunke-callout-size-picker', CalloutSizePicker);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-callout': CalloutBlockComponent;
    'yunke-emoji-menu': EmojiMenu;
    'yunke-callout-color-picker': CalloutColorPicker;
    'yunke-callout-size-picker': CalloutSizePicker;
  }
}
