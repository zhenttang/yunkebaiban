import { TextSelection } from '@blocksuite/std';
import { describe, expect, it } from 'vitest';

import { yunke } from './yunke-template';

describe('helpers/yunke-template', () => {
  it('should create a basic document structure from template', () => {
    const host = yunke`
      <yunke-page id="page">
        <yunke-note id="note">
          <yunke-paragraph id="paragraph-1">Hello, world</yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    expect(host.store).toBeDefined();

    const pageBlock = host.store.getBlock('page');
    expect(pageBlock).toBeDefined();
    expect(pageBlock?.flavour).toBe('yunke:page');

    const noteBlock = host.store.getBlock('note');
    expect(noteBlock).toBeDefined();
    expect(noteBlock?.flavour).toBe('yunke:note');

    const paragraphBlock = host.store.getBlock('paragraph-1');
    expect(paragraphBlock).toBeDefined();
    expect(paragraphBlock?.flavour).toBe('yunke:paragraph');
  });

  it('should handle nested blocks correctly', () => {
    const host = yunke`
      <yunke-page>
        <yunke-note>
          <yunke-paragraph>First paragraph</yunke-paragraph>
          <yunke-list>List item</yunke-list>
          <yunke-paragraph>Second paragraph</yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    const noteBlocks = host.store.getBlocksByFlavour('yunke:note');
    const paragraphBlocks = host.store.getBlocksByFlavour('yunke:paragraph');
    const listBlocks = host.store.getBlocksByFlavour('yunke:list');

    expect(noteBlocks.length).toBe(1);
    expect(paragraphBlocks.length).toBe(2);
    expect(listBlocks.length).toBe(1);

    const noteBlock = noteBlocks[0];
    const noteChildren =
      host.store.getBlock(noteBlock.id)?.model.children || [];
    expect(noteChildren.length).toBe(3);

    expect(noteChildren[0].flavour).toBe('yunke:paragraph');
    expect(noteChildren[1].flavour).toBe('yunke:list');
    expect(noteChildren[2].flavour).toBe('yunke:paragraph');
  });

  it('should handle empty blocks correctly', () => {
    const host = yunke`
      <yunke-page>
        <yunke-note>
          <yunke-paragraph></yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    const paragraphBlocks = host.store.getBlocksByFlavour('yunke:paragraph');
    expect(paragraphBlocks.length).toBe(1);

    const paragraphBlock = host.store.getBlock(paragraphBlocks[0].id);
    const paragraphText = paragraphBlock?.model.text?.toString() || '';
    expect(paragraphText).toBe('');
  });

  it('should throw error on invalid template', () => {
    expect(() => {
      yunke`
        <unknown-tag></unknown-tag>
      `;
    }).toThrow();
  });

  it('should handle text selection with anchor and focus', () => {
    const host = yunke`
      <yunke-page id="page">
        <yunke-note id="note">
          <yunke-paragraph id="paragraph-1">Hel<anchor />lo</yunke-paragraph>
          <yunke-paragraph id="paragraph-2">Wo<focus />rld</yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    const selection = host.selection.value[0] as TextSelection;
    expect(selection).toBeDefined();
    expect(selection.is(TextSelection)).toBe(true);
    expect(selection.from.blockId).toBe('paragraph-1');
    expect(selection.from.index).toBe(3);
    expect(selection.from.length).toBe(2);
    expect(selection.to?.blockId).toBe('paragraph-2');
    expect(selection.to?.index).toBe(0);
    expect(selection.to?.length).toBe(2);
  });

  it('should handle cursor position', () => {
    const host = yunke`
      <yunke-page id="page">
        <yunke-note id="note">
          <yunke-paragraph id="paragraph-1">Hello<cursor />World</yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    const selection = host.selection.value[0] as TextSelection;
    expect(selection).toBeDefined();
    expect(selection.is(TextSelection)).toBe(true);
    expect(selection.from.blockId).toBe('paragraph-1');
    expect(selection.from.index).toBe(5);
    expect(selection.from.length).toBe(0);
    expect(selection.to).toBeNull();
  });

  it('should handle selection in empty blocks', () => {
    const host = yunke`
      <yunke-page id="page">
        <yunke-note id="note">
          <yunke-paragraph id="paragraph-1"><cursor /></yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    const selection = host.selection.value[0] as TextSelection;
    expect(selection).toBeDefined();
    expect(selection.is(TextSelection)).toBe(true);
    expect(selection.from.blockId).toBe('paragraph-1');
    expect(selection.from.index).toBe(0);
    expect(selection.from.length).toBe(0);
    expect(selection.to).toBeNull();
  });

  it('should handle single point selection', () => {
    const host = yunke`
      <yunke-page id="page">
        <yunke-note id="note">
          <yunke-paragraph id="paragraph-1">Hello<anchor></anchor>World<focus></focus>Yunke</yunke-paragraph>
        </yunke-note>
      </yunke-page>
    `;

    const selection = host.selection.value[0] as TextSelection;
    expect(selection).toBeDefined();
    expect(selection.is(TextSelection)).toBe(true);
    expect(selection.from.blockId).toBe('paragraph-1');
    expect(selection.from.index).toBe(5);
    expect(selection.from.length).toBe(5);
    expect(selection.to).toBeNull();
  });
});
