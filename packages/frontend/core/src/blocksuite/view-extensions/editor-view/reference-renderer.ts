import type { ReactToLit } from '@yunke/component';
import type { YunkeReference } from '@blocksuite/yunke/inlines/reference';
import { ReferenceNodeConfigExtension } from '@blocksuite/yunke/inlines/reference';
import type { ExtensionType } from '@blocksuite/yunke/store';

export type ReferenceReactRenderer = (
  reference: YunkeReference
) => React.ReactElement;

export function patchReferenceRenderer(
  reactToLit: ReactToLit,
  reactRenderer: ReferenceReactRenderer
): ExtensionType {
  const customContent = (reference: YunkeReference) => {
    const node = reactRenderer(reference);
    return reactToLit(node, true);
  };

  return ReferenceNodeConfigExtension({
    customContent,
    hidePopup: BUILD_CONFIG.isMobileEdition,
  });
}
