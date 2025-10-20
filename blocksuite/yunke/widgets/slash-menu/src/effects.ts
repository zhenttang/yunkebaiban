import { YUNKE_SLASH_MENU_WIDGET } from './consts';
import { InnerSlashMenu, SlashMenu } from './slash-menu-popover';
import { YunkeSlashMenuWidget } from './widget';

export function effects() {
  customElements.define(YUNKE_SLASH_MENU_WIDGET, YunkeSlashMenuWidget);
  customElements.define('yunke-slash-menu', SlashMenu);
  customElements.define('inner-slash-menu', InnerSlashMenu);
}

declare global {
  interface HTMLElementTagNameMap {
    [YUNKE_SLASH_MENU_WIDGET]: YunkeSlashMenuWidget;
  }
}
