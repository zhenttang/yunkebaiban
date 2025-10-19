import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import {
  AllDocsIcon,
  DeleteIcon,
  JournalIcon,
  SettingsIcon,
  ShareIcon,
  TagsIcon,
  ViewLayersIcon,
} from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { memo, useCallback, useEffect, useState } from 'react';

import { useNavigateHelper } from '../hooks/use-navigate-helper';
import { WorkspaceDialogService } from '../../modules/dialogs';
import { WorkbenchService } from '../../modules/workbench';
import * as styles from './index.css';
import { QuickMenuItem } from './quick-menu-item';

export interface QuickMenuPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export const QuickMenuPanel = memo(({ workspaceId, onClose }: QuickMenuPanelProps) => {
  const t = useI18n();
  const navigationHelper = useNavigateHelper();
  const workspaceDialogService = useService(WorkspaceDialogService);
  const workbenchService = useService(WorkbenchService);
  const [activeIndex, setActiveIndex] = useState(0);

  const menuItems = [
    {
      icon: <AllDocsIcon />,
      title: t['com.affine.workspaceSubPath.all']?.() || 'All Docs',
      description: t['com.affine.quick-menu.all-docs.description']?.() || 'View all your documents',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'allDocs' });
        navigationHelper.jumpToPage(workspaceId, 'all');
        onClose();
      },
    },
    {
      icon: <ShareIcon />,
      title: t['com.affine.rootAppSidebar.community']?.() || 'Community',
      description: t['com.affine.quick-menu.community.description']?.() || 'Explore community content',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'community' });
        workbenchService.workbench.openCommunity();
        onClose();
      },
    },
    {
      icon: <JournalIcon />,
      title: t['com.affine.journal.app-sidebar-title']?.() || 'Journal',
      description: t['com.affine.quick-menu.journal.description']?.() || 'Open today\'s journal',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'journal' });
        workbenchService.workbench.openJournal();
        onClose();
      },
    },
    {
      icon: <ViewLayersIcon />,
      title: t['com.affine.collections.header']?.() || 'Collections',
      description: t['com.affine.quick-menu.collections.description']?.() || 'Manage your collections',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'collections' });
        navigationHelper.jumpToCollections(workspaceId);
        onClose();
      },
    },
    {
      icon: <TagsIcon />,
      title: t['com.affine.tags.header']?.() || 'Tags',
      description: t['com.affine.quick-menu.tags.description']?.() || 'View all tags',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'tags' });
        navigationHelper.jumpToTags(workspaceId);
        onClose();
      },
    },
    {
      icon: <DeleteIcon />,
      title: t['com.affine.workspaceSubPath.trash']?.() || 'Trash',
      description: t['com.affine.quick-menu.trash.description']?.() || 'View deleted items',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'trash' });
        navigationHelper.jumpToPage(workspaceId, 'trash');
        onClose();
      },
    },
    {
      icon: <SettingsIcon />,
      title: t['com.affine.settingSidebar.title']?.() || 'Settings',
      description: t['com.affine.quick-menu.settings.description']?.() || 'Configure your workspace',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'settings' });
        workspaceDialogService.open('setting', {
          activeTab: 'appearance',
        });
        onClose();
      },
    },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        menuItems[activeIndex]?.onClick();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [activeIndex, menuItems, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <div className={styles.quickMenuOverlay} onClick={onClose} />
      <div className={styles.quickMenuPanel}>
        <div className={styles.quickMenuHeader}>
          {t['com.affine.quick-menu.title']?.() || 'Quick Menu'}
        </div>
        <div className={styles.quickMenuContent}>
          {menuItems.map((item, index) => (
            <QuickMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={item.onClick}
              active={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </>
  );
});

QuickMenuPanel.displayName = 'QuickMenuPanel';
