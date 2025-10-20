import { type DropTargetDropEvent, useDropTarget } from '@yunke/component';
import type { YunkeDNDData } from '@yunke/core/types/dnd';
import { useI18n } from '@yunke/i18n';

import { EmptyNodeChildren } from '../../layouts/empty-node-children';

export const Empty = ({
  onDrop,
  noAccessible = false,
}: {
  onDrop: (data: DropTargetDropEvent<YunkeDNDData>) => void;
  noAccessible?: boolean;
}) => {
  const { dropTargetRef } = useDropTarget<YunkeDNDData>(
    () => ({
      onDrop,
    }),
    [onDrop]
  );
  const t = useI18n();

  return (
    <EmptyNodeChildren ref={dropTargetRef}>
      {noAccessible
        ? t['com.yunke.share-menu.option.permission.no-access']()
        : t['com.yunke.rootAppSidebar.docs.no-subdoc']()}
    </EmptyNodeChildren>
  );
};
