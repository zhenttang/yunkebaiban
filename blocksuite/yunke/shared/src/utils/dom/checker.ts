import type { EditorHost } from '@blocksuite/std';

export function isInsidePageEditor(host: EditorHost) {
  return Array.from(host.children).some(
    v => v.tagName.toLowerCase() === 'yunke-page-root'
  );
}

export function isInsideEdgelessEditor(host: EditorHost) {
  if (!host) return false;

  return Array.from(host.children).some(
    v =>
      v.tagName.toLowerCase() === 'yunke-edgeless-root' ||
      v.tagName.toLowerCase() === 'yunke-edgeless-root-preview'
  );
}
