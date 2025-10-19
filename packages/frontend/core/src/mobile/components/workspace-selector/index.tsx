import { MobileMenu } from '@yunke/component';
import { WorkspacesService } from '@yunke/core/modules/workspace';
import { track } from '@yunke/track';
import { useServiceOptional } from '@toeverything/infra';
import {
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { CurrentWorkspaceCard } from './current-card';
import { SelectorMenu } from './menu';

export const WorkspaceSelector = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function WorkspaceSelector({ className }, ref) {
  const [open, setOpen] = useState(false);
  const workspaceManager = useServiceOptional(WorkspacesService);

  const openMenu = useCallback(() => {
    track.$.navigationPanel.workspaceList.open();
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // revalidate workspace list when open workspace list
  useEffect(() => {
    if (open) workspaceManager?.list.revalidate();
  }, [workspaceManager, open]);

  return (
    <MobileMenu
      items={<SelectorMenu onClose={close} />}
      rootOptions={{ open }}
      contentOptions={{
        onInteractOutside: close,
        onEscapeKeyDown: close,
        style: { padding: 0 },
      }}
    >
      <CurrentWorkspaceCard
        ref={ref}
        onClick={openMenu}
        className={className}
      />
    </MobileMenu>
  );
});
