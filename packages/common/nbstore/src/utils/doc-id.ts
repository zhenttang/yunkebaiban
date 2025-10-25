const DOC_PREFIX = 'db';
const USERDATA_PREFIX = 'userdata';

export function normalizeDocId(docId: string): string {
  if (!docId || !docId.includes('$')) {
    return docId;
  }

  const parts = docId.split('$');
  if (parts.length < 3) {
    return docId;
  }

  if (parts[0] === DOC_PREFIX) {
    const spaceId = parts[1];
    const rest = parts.slice(2);
    let index = 0;
    while (index < rest.length && rest[index] === spaceId) {
      index++;
    }
    const normalizedRest = rest.slice(index);
    if (normalizedRest.length === 0) {
      return docId;
    }
    return [DOC_PREFIX, ...normalizedRest].join('$');
  }

  if (parts[0] === USERDATA_PREFIX && parts.length >= 4) {
    const userId = parts[1];
    const spaceId = parts[2];
    const rest = parts.slice(3);
    let index = 0;
    while (index < rest.length && rest[index] === spaceId) {
      index++;
    }
    const normalizedRest = rest.slice(index);
    if (normalizedRest.length === 0) {
      return docId;
    }
    return [USERDATA_PREFIX, userId, ...normalizedRest].join('$');
  }

  return docId;
}
