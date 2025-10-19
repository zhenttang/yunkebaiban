import { MenuItem } from '@yunke/core/modules/app-sidebar/views';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { CollaborationIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback, forwardRef } from 'react';

// Wrap CollaborationIcon to support ref forwarding by wrapping it in a span
const CollaborationIconWithRef = forwardRef<HTMLSpanElement>((props, ref) => (
  <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center' }}>
    <CollaborationIcon {...props} />
  </span>
));
CollaborationIconWithRef.displayName = 'CollaborationIconWithRef';

export const InviteMembersButton = () => {
  const workspace = useService(WorkspaceService).workspace;

  const isLocal = workspace.flavour === 'local';

  const dialogService = useService(WorkspaceDialogService);
  const onOpenInviteMembersModal = useCallback(() => {
    dialogService.open('setting', {
      activeTab: `workspace:members`,
    });
  }, [dialogService]);

  const t = useI18n();

  if (isLocal) {
    return null;
  }

  return (
    <MenuItem
      data-testid="slider-bar-invite-members-button"
      icon={<CollaborationIconWithRef />}
      onClick={onOpenInviteMembersModal}
    >
      {t['Invite Members']()}
    </MenuItem>
  );
};
