import { type DropTargetDropEvent, useDropTarget } from '@yunke/component';
import type { YunkeDNDData } from '@yunke/core/types/dnd';
import { useI18n } from '@yunke/i18n';

import { EmptyNodeChildren } from '../../layouts/empty-node-children';

export const Empty = ({
  onDrop,
}: {
  onDrop: (data: DropTargetDropEvent<YunkeDNDData>) => void;
}) => {
  const { dropTargetRef } = useDropTarget(
    () => ({
      onDrop,
    }),
    [onDrop]
  );
  const t = useI18n();
  return (
    <EmptyNodeChildren ref={dropTargetRef}>
      {t['com.yunke.rootAppSidebar.tags.no-doc']()}
    </EmptyNodeChildren>
  );
};
