import type { ReactToLit } from '@yunke/component';
import type { AffineReference } from '@blocksuite/yunke/inlines/reference';
import { ReferenceNodeConfigExtension } from '@blocksuite/yunke/inlines/reference';
import type { ExtensionType } from '@blocksuite/yunke/store';

export type ReferenceReactRenderer = (
  reference: AffineReference
) => React.ReactElement;

export function patchReferenceRenderer(
  reactToLit: ReactToLit,
  reactRenderer: ReferenceReactRenderer
): ExtensionType {
  const customContent = (reference: AffineReference) => {
    const node = reactRenderer(reference);
    return reactToLit(node, true);
  };

  return ReferenceNodeConfigExtension({
    customContent,
    hidePopup: BUILD_CONFIG.isMobileEdition,
  });
}
