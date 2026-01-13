import type { RichText } from '@blocksuite/yunke/rich-text';
import { type EditorHost, TextSelection } from '@blocksuite/yunke/std';

import { handleInlineAskAIAction } from '../../actions/doc-handler';
import { AIProvider } from '../../provider';
import type { YunkeAIPanelWidget } from '../../widgets/ai-panel/ai-panel';

function isAIShortcut(event: KeyboardEvent) {
  const isSpace =
    event.key === ' ' && event.code === 'Space' && !event.isComposing;
  const hasPrimaryModifier = event.ctrlKey || event.metaKey;
  return isSpace && hasPrimaryModifier && event.shiftKey;
}

function insertSpace(host: EditorHost) {
  const textSelection = host.selection.find(TextSelection);
  if (!textSelection || !textSelection.isCollapsed()) return;

  const blockComponent = host.view.getBlock(textSelection.from.blockId);
  if (!blockComponent) return;

  const richText = blockComponent.querySelector('rich-text') as RichText | null;
  if (!richText) return;

  const inlineEditor = richText.inlineEditor;
  inlineEditor?.insertText(
    {
      index: textSelection.from.index,
      length: 0,
    },
    ' '
  );
}

export function setupSpaceAIEntry(panel: YunkeAIPanelWidget) {
  // Use Ctrl/Cmd+Shift+Space as the trigger so plain spaces keep working.
  // The keypress listener still filters out IME confirmation events.
  panel.handleEvent('keyPress', ctx => {
    const host = panel.host;
    const keyboardState = ctx.get('keyboardState');
    const event = keyboardState.raw;
    if (AIProvider.actions.chat && isAIShortcut(event)) {
      // If the AI panel is in the input state and the input content is empty,
      // insert a space back into the editor.
      if (panel.state === 'input') {
        const input = panel.shadowRoot?.querySelector('ai-panel-input');
        if (input?.textarea.value.trim() === '') {
          event.preventDefault();
          insertSpace(host);
          panel.hide();
        }

        return;
      }

      const selection = host.selection.find(TextSelection);
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.getBlock(selection.blockId);
        const blockText = block?.model?.text?.toString() ?? '';
        const isEmptyParagraph =
          block?.model?.flavour === 'yunke:paragraph' &&
          blockText.trim().length === 0;

        if (!isEmptyParagraph) return;

        event.preventDefault();
        handleInlineAskAIAction(host);
      }
    }
  });
}
