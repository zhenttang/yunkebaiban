import { registerAIEffects } from '@yunke/core/blocksuite/ai/effects';
import { editorEffects } from '@yunke/core/blocksuite/editors';

import { registerTemplates } from './register-templates';

editorEffects();
registerAIEffects();
registerTemplates();

export * from './blocksuite-editor';
