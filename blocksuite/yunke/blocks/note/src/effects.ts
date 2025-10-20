import { EdgelessNoteBackground } from './components/edgeless-note-background';
import { EdgelessNoteBorderDropdownMenu } from './components/edgeless-note-border-dropdown-menu';
import { EdgelessNoteDisplayModeDropdownMenu } from './components/edgeless-note-display-mode-dropdown-menu';
import { EdgelessNoteMask } from './components/edgeless-note-mask';
import { EdgelessNoteShadowMenu } from './components/edgeless-note-shadow-menu';
import { EdgelessNoteStylePanel } from './components/edgeless-note-style-panel';
import { EdgelessPageBlockTitle } from './components/edgeless-page-block-title';
import { NoteBlockComponent } from './note-block';
import {
  YUNKE_EDGELESS_NOTE,
  EdgelessNoteBlockComponent,
} from './note-edgeless-block';
export function effects() {
  customElements.define('yunke-note', NoteBlockComponent);
  customElements.define(YUNKE_EDGELESS_NOTE, EdgelessNoteBlockComponent);
  customElements.define('edgeless-note-mask', EdgelessNoteMask);
  customElements.define('edgeless-note-background', EdgelessNoteBackground);
  customElements.define('edgeless-page-block-title', EdgelessPageBlockTitle);
  customElements.define('edgeless-note-shadow-menu', EdgelessNoteShadowMenu);
  customElements.define(
    'edgeless-note-border-dropdown-menu',
    EdgelessNoteBorderDropdownMenu
  );
  customElements.define(
    'edgeless-note-display-mode-dropdown-menu',
    EdgelessNoteDisplayModeDropdownMenu
  );
  customElements.define('edgeless-note-style-panel', EdgelessNoteStylePanel);
}
