import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { MoreHorizontalIcon } from '@blocksuite/icons/rc';
import { useServiceOptional } from '@toeverything/infra';
import { useAtom } from 'jotai';
import { memo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { quickMenuOpenAtom } from '../atoms';

import { QuickMenuPanel } from '../quick-menu-panel';
import * as styles from './quick-menu-button.css';

export const QuickMenuButton = memo(() => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useAtom(quickMenuOpenAtom);
  const currentWorkspace = useServiceOptional(WorkspaceService)?.workspace;

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  if (!currentWorkspace) {
    return null;
  }

  return (
    <>
      <div
        className={styles.quickMenuButton}
        onClick={handleToggle}
        data-active={isOpen}
        title={t['com.yunke.quick-menu.title']?.() || 'Quick Menu'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <MoreHorizontalIcon />
      </div>
      {isOpen &&
        createPortal(
          <QuickMenuPanel workspaceId={currentWorkspace.id} onClose={handleClose} />,
          document.body
        )}
    </>
  );
});

QuickMenuButton.displayName = 'QuickMenuButton';
