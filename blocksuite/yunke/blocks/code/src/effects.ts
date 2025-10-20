import { CodeBlockComponent } from './code-block';
import {
  YUNKE_CODE_TOOLBAR_WIDGET,
  YunkeCodeToolbarWidget,
} from './code-toolbar';
import { YunkeCodeToolbar } from './code-toolbar/components/code-toolbar';
import { LanguageListButton } from './code-toolbar/components/lang-button';
import { PreviewButton } from './code-toolbar/components/preview-button';
import { YunkeCodeUnit } from './highlight/yunke-code-unit';

export function effects() {
  customElements.define('language-list-button', LanguageListButton);
  customElements.define('yunke-code-toolbar', YunkeCodeToolbar);
  customElements.define(YUNKE_CODE_TOOLBAR_WIDGET, YunkeCodeToolbarWidget);
  customElements.define('yunke-code-unit', YunkeCodeUnit);
  customElements.define('yunke-code', CodeBlockComponent);
  customElements.define('preview-button', PreviewButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'language-list-button': LanguageListButton;
    'yunke-code-toolbar': YunkeCodeToolbar;
    'preview-button': PreviewButton;
    [YUNKE_CODE_TOOLBAR_WIDGET]: YunkeCodeToolbarWidget;
  }
}
