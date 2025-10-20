import { AdapterPanel, YUNKE_ADAPTER_PANEL } from './adapter-panel';
import {
  AdapterPanelBody,
  YUNKE_ADAPTER_PANEL_BODY,
} from './body/adapter-panel-body';
import { AdapterMenu, YUNKE_ADAPTER_MENU } from './header/adapter-menu';
import {
  AdapterPanelHeader,
  YUNKE_ADAPTER_PANEL_HEADER,
} from './header/adapter-panel-header';

export function effects() {
  customElements.define(YUNKE_ADAPTER_PANEL, AdapterPanel);
  customElements.define(YUNKE_ADAPTER_MENU, AdapterMenu);
  customElements.define(YUNKE_ADAPTER_PANEL_HEADER, AdapterPanelHeader);
  customElements.define(YUNKE_ADAPTER_PANEL_BODY, AdapterPanelBody);
}
