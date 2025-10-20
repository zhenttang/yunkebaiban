import {
  YUNKE_FRAME_PANEL_BODY,
  FramePanelBody,
} from './body/frame-panel-body';
import { YUNKE_FRAME_CARD, FrameCard } from './card/frame-card';
import {
  YUNKE_FRAME_CARD_TITLE,
  FrameCardTitle,
} from './card/frame-card-title';
import {
  YUNKE_FRAME_TITLE_EDITOR,
  FrameCardTitleEditor,
} from './card/frame-card-title-editor';
import { YUNKE_FRAME_PREVIEW, FramePreview } from './card/frame-preview';
import { YUNKE_FRAME_PANEL, FramePanel } from './frame-panel';
import {
  YUNKE_FRAME_PANEL_HEADER,
  FramePanelHeader,
} from './header/frame-panel-header';
import {
  YUNKE_FRAMES_SETTING_MENU,
  FramesSettingMenu,
} from './header/frames-setting-menu';

export function effects() {
  customElements.define(YUNKE_FRAME_PANEL, FramePanel);
  customElements.define(YUNKE_FRAME_TITLE_EDITOR, FrameCardTitleEditor);
  customElements.define(YUNKE_FRAME_CARD, FrameCard);
  customElements.define(YUNKE_FRAME_CARD_TITLE, FrameCardTitle);
  customElements.define(YUNKE_FRAME_PANEL_BODY, FramePanelBody);
  customElements.define(YUNKE_FRAME_PANEL_HEADER, FramePanelHeader);
  customElements.define(YUNKE_FRAMES_SETTING_MENU, FramesSettingMenu);
  customElements.define(YUNKE_FRAME_PREVIEW, FramePreview);
}
