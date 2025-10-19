import { insertInlineLatex } from '@blocksuite/yunke-inline-latex';
import {
  getSelectedModelsCommand,
  getTextSelectionCommand,
} from '@blocksuite/yunke-shared/commands';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { TeXIcon } from '@blocksuite/icons/lit';

import { insertLatexBlockCommand } from '../commands';
import { LatexTooltip } from './tooltips';

export const latexSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: '内联公式',
      group: '0_Basic@8',
      description: '创建内联公式。',
      icon: TeXIcon(),
      tooltip: {
        figure: LatexTooltip(
          'Energy. Mass. Light. In a single equation,',
          'E=mc^2',
          false
        ),
        caption: 'Inline equation',
      },
      searchAlias: ['inlineMath, inlineEquation', 'inlineLatex'],
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getTextSelectionCommand)
          .pipe(insertInlineLatex)
          .run();
      },
    },
    {
      name: '公式',
      description: '创建公式块。',
      icon: TeXIcon(),
      tooltip: {
        figure: LatexTooltip(
          'Create a equation via LaTeX.',
          String.raw`\frac{a}{b} \pm \frac{c}{d} = \frac{ad \pm bc}{bd}`,
          true
        ),
        caption: 'Equation',
      },
      searchAlias: ['mathBlock, equationBlock', 'latexBlock'],
      group: '4_Content & Media@10',
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertLatexBlockCommand, {
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
  ],
};
