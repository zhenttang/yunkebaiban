/**
 * @vitest-environment happy-dom
 */
import '../../helpers/yunke-test-utils';

import type { TextSelection } from '@blocksuite/std';
import { describe, expect, it } from 'vitest';

import { replaceSelectedTextWithBlocksCommand } from '../../../commands/model-crud/replace-selected-text-with-blocks';
import { yunke, block } from '../../helpers/yunke-template';

describe('commands/model-crud', () => {
  describe('replaceSelectedTextWithBlocksCommand', () => {
    it('should replace selected text with blocks when both first and last blocks are mergable blocks', () => {
      const host = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel<anchor />lo</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">Wor<focus />ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-paragraph id="111">111</yunke-paragraph>`,
        block`<yunke-code id="code"></yunke-code>`,
        block`<yunke-paragraph id="222">222</yunke-paragraph>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel111</yunke-paragraph>
            <yunke-code id="code"></yunke-code>
            <yunke-paragraph id="paragraph-2">222ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when both first and last blocks are mergable blocks in single paragraph', () => {
      const host = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel<anchor></anchor>lo Wor<focus></focus>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-paragraph id="111">111</yunke-paragraph>`,
        block`<yunke-code id="code"></yunke-code>`,
        block`<yunke-paragraph id="222">222</yunke-paragraph>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel111</yunke-paragraph>
            <yunke-code id="code"></yunke-code>
            <yunke-paragraph id="222">222ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when blocks contains only one mergable block', () => {
      const host = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel<anchor />lo</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">Wor<focus />ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [block`<yunke-paragraph id="111">111</yunke-paragraph>`]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel111ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when blocks contains only one mergable block in single paragraph', () => {
      const host = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel<anchor></anchor>lo Wor<focus></focus>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [block`<yunke-paragraph id="111">111</yunke-paragraph>`]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page id="page">
          <yunke-note id="note">
            <yunke-paragraph id="paragraph-1">Hel111ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when only first block is mergable block', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor />lo</yunke-paragraph>
            <yunke-paragraph>Wor<focus />ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-paragraph>111</yunke-paragraph>`,
        block`<yunke-code></yunke-code>`,
        block`<yunke-code></yunke-code>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-paragraph>Hel111</yunke-paragraph>
            <yunke-code></yunke-code>
            <yunke-code></yunke-code>
            <yunke-paragraph>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when only first block is mergable block in single paragraph', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor></anchor>lo Wor<focus></focus>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-paragraph>111</yunke-paragraph>`,
        block`<yunke-code></yunke-code>`,
        block`<yunke-code></yunke-code>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel111</yunke-paragraph>
            <yunke-code></yunke-code>
            <yunke-code></yunke-code>
            <yunke-paragraph>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when only last block is mergable block', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor />lo</yunke-paragraph>
            <yunke-paragraph>Wor<focus />ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-code></yunke-code>`,
        block`<yunke-code></yunke-code>`,
        block`<yunke-paragraph>111</yunke-paragraph>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-paragraph>Hel</yunke-paragraph>
            <yunke-code></yunke-code>
            <yunke-code></yunke-code>
            <yunke-paragraph>111ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when only last block is mergable block in single paragraph', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor></anchor>lo Wor<focus></focus>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-code></yunke-code>`,
        block`<yunke-code></yunke-code>`,
        block`<yunke-paragraph>111</yunke-paragraph>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel</yunke-paragraph>
            <yunke-code></yunke-code>
            <yunke-code></yunke-code>
            <yunke-paragraph>111ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when neither first nor last block is mergable block', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor />lo</yunke-paragraph>
            <yunke-paragraph>Wor<focus />ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-code></yunke-code>`,
        block`<yunke-code></yunke-code>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-paragraph>Hel</yunke-paragraph>
            <yunke-code></yunke-code>
            <yunke-code></yunke-code>
            <yunke-paragraph>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when neither first nor last block is mergable block in single paragraph', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor></anchor>lo Wor<focus></focus>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-code></yunke-code>`,
        block`<yunke-code></yunke-code>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel</yunke-paragraph>
            <yunke-code></yunke-code>
            <yunke-code></yunke-code>
            <yunke-paragraph>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when both first and last blocks are mergable blocks with different types', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-paragraph>Hel<anchor />lo</yunke-paragraph>
            <yunke-paragraph>Wor<focus />ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-list>1.</yunke-list>`,
        block`<yunke-list>2.</yunke-list>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-paragraph>Hel</yunke-paragraph>
            <yunke-list>1.</yunke-list>
            <yunke-list>2.</yunke-list>
            <yunke-paragraph>ld</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when both first and last blocks are paragraphs, and cursor is at the end of the text-block with different types', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-list>Hel<anchor />lo</yunke-list>
            <yunke-list>Wor<focus />ld</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-paragraph>111</yunke-paragraph>`,
        block`<yunke-paragraph>222</yunke-paragraph>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-list>Hel111</yunke-list>
            <yunke-list>222ld</yunke-list>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when first block is paragraph, and cursor is at the end of the text-block with different type  ', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-list>Hel<anchor />lo</yunke-list>
            <yunke-list>Wor<focus />ld</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-paragraph>111</yunke-paragraph>`,
        block`<yunke-code></yunke-code>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-list>Hel111</yunke-list>
            <yunke-code></yunke-code>
            <yunke-list>ld</yunke-list>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });

    it('should replace selected text with blocks when last block is paragraph, and cursor is at the end of the text-block with different type  ', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note>
            <yunke-list>Hel<anchor />lo</yunke-list>
            <yunke-list>Wor<focus />ld</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const blocks = [
        block`<yunke-code></yunke-code>`,
        block`<yunke-paragraph>222</yunke-paragraph>`,
      ]
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(b => b.model);

      const textSelection = host.selection.value[0] as TextSelection;

      host.command.exec(replaceSelectedTextWithBlocksCommand, {
        textSelection,
        blocks,
      });

      const expected = yunke`
        <yunke-page>
          <yunke-note >
            <yunke-list>Hel</yunke-list>
            <yunke-code></yunke-code>
            <yunke-list>222ld</yunke-list>
          </yunke-note>
        </yunke-page>
      `;
      expect(host.store).toEqualDoc(expected.store);
    });
  });
});
