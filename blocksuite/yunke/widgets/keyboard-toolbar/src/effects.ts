import {
  YUNKE_KEYBOARD_TOOLBAR_WIDGET,
  YunkeKeyboardToolbarWidget,
} from './index.js';
import {
  YUNKE_KEYBOARD_TOOL_PANEL,
  YunkeKeyboardToolPanel,
} from './keyboard-tool-panel.js';
import {
  YUNKE_KEYBOARD_TOOLBAR,
  YunkeKeyboardToolbar,
} from './keyboard-toolbar.js';

export function effects() {
  customElements.define(
    YUNKE_KEYBOARD_TOOLBAR_WIDGET,
    YunkeKeyboardToolbarWidget
  );
  customElements.define(YUNKE_KEYBOARD_TOOLBAR, YunkeKeyboardToolbar);
  customElements.define(YUNKE_KEYBOARD_TOOL_PANEL, YunkeKeyboardToolPanel);
}

declare global {
  interface HTMLElementTagNameMap {
    [YUNKE_KEYBOARD_TOOLBAR]: YunkeKeyboardToolbar;
    [YUNKE_KEYBOARD_TOOL_PANEL]: YunkeKeyboardToolPanel;
  }
}
