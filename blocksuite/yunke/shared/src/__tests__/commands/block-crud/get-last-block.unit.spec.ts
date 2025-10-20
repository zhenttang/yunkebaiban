/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';

import { getLastBlockCommand } from '../../../commands/block-crud/get-last-content-block';
import { yunke } from '../../helpers/yunke-template';

describe('commands/block-crud', () => {
  describe('getLastBlockCommand', () => {
    it('should return null when root is not exists', () => {
      const host = yunke`<yunke-page></yunke-page>`;

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: 'content',
        root: undefined,
      });

      expect(lastBlock).toBeNull();
    });

    it('should return last block with content role when found', () => {
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

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: 'hub',
        root: undefined,
      });

      expect(lastBlock?.id).toBe('note-2');
    });

    it('should return last block with any role in the array when found', () => {
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

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: ['hub', 'content'],
        root: undefined,
      });

      expect(lastBlock?.id).toBe('note-2');
    });

    it('should return last block with specified flavour when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Paragraph</yunke-paragraph>
            <yunke-list id="list-1">List Item</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        flavour: 'yunke:list',
        root: note,
      });

      expect(lastBlock?.id).toBe('list-1');
    });

    it('should return last block with any flavour in the array when found', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">Paragraph</yunke-paragraph>
            <yunke-list id="list-1">List Item</yunke-list>
          </yunke-note>
        </yunke-page>
      `;

      const note = host.store.getBlock('note-1')?.model;

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        flavour: ['yunke:list', 'yunke:code'],
        root: note,
      });

      expect(lastBlock?.id).toBe('list-1');
    });

    it('should return last block matching both role and flavour when both specified', () => {
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
      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: 'content',
        flavour: 'yunke:list',
        root: note,
      });

      expect(lastBlock?.id).toBe('list-1');
    });

    it('should return last block with default roles when role not specified', () => {
      const host = yunke`
        <yunke-page>
          <yunke-note id="note-1">
            <yunke-paragraph id="paragraph-1">hub Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-2">Content Paragraph</yunke-paragraph>
            <yunke-paragraph id="paragraph-3">Hub Paragraph</yunke-paragraph>
          </yunke-note>
        </yunke-page>
      `;

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        root: undefined,
      });

      expect(lastBlock?.id).toBe('note-1');
    });

    it('should return last block with specified role when found', () => {
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

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: 'hub',
        root: note,
      });

      expect(lastBlock?.id).toBe('database-1');
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

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: 'hub',
        root: note,
      });

      expect(lastBlock).toBeNull();
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

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        flavour: 'yunke:list',
        root: note,
      });

      expect(lastBlock).toBeNull();
    });

    it('should return last block with specified role within specified root subtree', () => {
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

      const [_, { lastBlock }] = host.command.exec(getLastBlockCommand, {
        role: 'content',
        root: note,
      });

      expect(lastBlock?.id).toBe('paragraph-2-2');
    });
  });
});
