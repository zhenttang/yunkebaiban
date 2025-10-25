import { describe, expect, it } from 'vitest';

import { normalizeDocId } from '../doc-id';

describe('normalizeDocId', () => {
  it('returns original id when no workspace segment', () => {
    expect(normalizeDocId('note')).toBe('note');
    expect(normalizeDocId('db$doc')).toBe('db$doc');
  });

  it('removes duplicated workspace segments for db prefix', () => {
    expect(normalizeDocId('db$workspace$doc')).toBe('db$doc');
    expect(normalizeDocId('db$workspace$workspace$doc')).toBe('db$doc');
  });

  it('removes duplicated workspace segments for userdata prefix', () => {
    expect(normalizeDocId('userdata$user$workspace$doc')).toBe('userdata$user$doc');
    expect(normalizeDocId('userdata$user$workspace$workspace$doc')).toBe('userdata$user$doc');
  });

  it('keeps non duplicated segments intact', () => {
    expect(normalizeDocId('db$workspace$folder$doc')).toBe('db$folder$doc');
    expect(normalizeDocId('userdata$user$workspace$folder$doc')).toBe('userdata$user$folder$doc');
  });
});
