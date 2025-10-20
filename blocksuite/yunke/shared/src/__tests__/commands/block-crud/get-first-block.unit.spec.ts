/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';

import { getFirstBlockCommand } from '../../../commands/block-crud/get-first-content-block';
import { yunke } from '../../helpers/yunke-template';

describe('commands/block-crud', () => {
  describe('getFirstBlockCommand', () => {
    it('should return null when root is not exists', () => {
      const host = yunke`<yunke-page></yunke-page>`;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: 'content',
        root: undefined,
      });

      expect(firstBlock).toBeNull();
    });

    it('should return first block with content role when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1-1">First Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-1-2">Second Paragraph</yunke-paragraph>
          </yunke-note>
          <yunke-note id="note-2">
            <yunke-paragraph id="paragraph-2-1">First Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2-2">Second Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: 'hub',
        root: undefined,
      });

      expect(firstBlock?.id).toBe('note-1');
    });

    it('should return first block with any role in the array when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1-1">First Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-1-2">Second Paragraph</yunke-paragraph>
          </yunke-note>
          <yunke-note id="note-2">
            <yunke-paragraph id="paragraph-2-1">First Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2-2">Second Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: ['hub', 'content'],
        root: undefined,
      });

      expect(firstBlock?.id).toBe('note-1');
    });

    it('should return first block with specified flavour when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Paragraph</yunke-paragraph>
            <yunke-list id="list-1">List Item</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        flavour: 'yunke:list',
        root: note,
      });

      expect(firstBlock?.id).toBe('list-1');
    });

    it('should return first block with any flavour in the array when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Paragraph</yunke-paragraph>
            <yunke-list id="list-1">List Item</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        flavour: ['yunke:list', 'yunke:code'],
        root: note,
      });

      expect(firstBlock?.id).toBe('list-1');
    });

    it('should return first block matching both role and flavour when both specified', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Content Paragraph</yunke-paragraph>
            <yunke-list id="list-1">Content List</yunke-list>
            <yunke-paragraph id="paragraph-2">hub Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;
      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: 'content',
        flavour: 'yunke:list',
        root: note,
      });

      expect(firstBlock?.id).toBe('list-1');
    });

    it('should return first block with default roles when role not specified', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">hub Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">Content Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-3">Hub Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        root: undefined,
      });

      expect(firstBlock?.id).toBe('note-1');
    });

    it('should return first block with specified role when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Content Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">hub Paragraph</yunke-paragraph>
            <yunke-database id="database-1">Database</yunke-database>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: 'hub',
        root: note,
      });

      expect(firstBlock?.id).toBe('database-1');
    });

    it('should return null when no blocks with specified role are found in children', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Content Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">Another Content Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: 'hub',
        root: note,
      });

      expect(firstBlock).toBeNull();
    });

    it('should return null when no blocks with specified flavour are found in children', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">Another Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        flavour: 'yunke:list',
        root: note,
      });

      expect(firstBlock).toBeNull();
    });

    it('should return first block with specified role within specified root subtree', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1-1">1-1 Content</yunke-paragraph>
            <yunke-paragraph id="paragraph-1-2">1-2 hub</yunke-paragraph>
          </yunke-note>
          <yunke-note id="note-2">
            <yunke-paragraph id="paragraph-2-1">2-1 hub</yunke-paragraph>
            <yunke-paragraph id="paragraph-2-2">2-2 Content</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-2')?.model;

      const [_, { firstBlock }] = host.command.exec(getFirstBlockCommand, {
        role: 'content',
        root: note,
      });

      expect(firstBlock?.id).toBe('paragraph-2-1');
    });
  });
});
