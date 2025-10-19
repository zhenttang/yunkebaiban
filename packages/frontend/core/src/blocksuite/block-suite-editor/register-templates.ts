import { builtInTemplates as builtInEdgelessTemplates } from '@yunke/templates/edgeless';
import { builtInTemplates as builtInStickersTemplates } from '@yunke/templates/stickers';
import {
  EdgelessTemplatePanel,
  type TemplateManager,
} from '@blocksuite/yunke/gfx/template';

export function registerTemplates() {
  EdgelessTemplatePanel.templates.extend(
    builtInStickersTemplates as TemplateManager
  );
  EdgelessTemplatePanel.templates.extend(
    builtInEdgelessTemplates as TemplateManager
  );
}
