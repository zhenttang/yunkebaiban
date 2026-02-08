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
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

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

  // M-9 修复：useMemo 包裹 menuItems，避免每次渲染重建导致 handleKeyDown 和事件监听器反复注册
  const menuItems = useMemo(() => [
    {
      icon: <AllDocsIcon />,
      title: t['com.yunke.workspaceSubPath.all']?.() || 'All Docs',
      description: t['com.yunke.quick-menu.all-docs.description']?.() || 'View all your documents',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'allDocs' });
        navigationHelper.jumpToPage(workspaceId, 'all');
        onClose();
      },
    },
    {
      icon: <ShareIcon />,
      title: t['com.yunke.rootAppSidebar.community']?.() || 'Community',
      description: t['com.yunke.quick-menu.community.description']?.() || 'Explore community content',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'community' });
        workbenchService.workbench.openCommunity();
        onClose();
      },
    },
    {
      icon: <JournalIcon />,
      title: t['com.yunke.journal.app-sidebar-title']?.() || 'Journal',
      description: t['com.yunke.quick-menu.journal.description']?.() || 'Open today\'s journal',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'journal' });
        workbenchService.workbench.openJournal();
        onClose();
      },
    },
    {
      icon: <ViewLayersIcon />,
      title: t['com.yunke.collections.header']?.() || 'Collections',
      description: t['com.yunke.quick-menu.collections.description']?.() || 'Manage your collections',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'collections' });
        navigationHelper.jumpToCollections(workspaceId);
        onClose();
      },
    },
    {
      icon: <TagsIcon />,
      title: t['com.yunke.rootAppSidebar.tags']?.() || '标签',
      description: t['com.yunke.quick-menu.tags.description']?.() || 'View all tags',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'tags' });
        navigationHelper.jumpToTags(workspaceId);
        onClose();
      },
    },
    {
      icon: <DeleteIcon />,
      title: t['com.yunke.workspaceSubPath.trash']?.() || 'Trash',
      description: t['com.yunke.quick-menu.trash.description']?.() || 'View deleted items',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'trash' });
        navigationHelper.jumpToPage(workspaceId, 'trash');
        onClose();
      },
    },
    {
      icon: <SettingsIcon />,
      title: t['com.yunke.settingSidebar.title']?.() || 'Settings',
      description: t['com.yunke.quick-menu.settings.description']?.() || 'Configure your workspace',
      onClick: () => {
        track.$.quickMenu.$.navigate({ to: 'settings' });
        workspaceDialogService.open('setting', {
          activeTab: 'appearance',
        });
        onClose();
      },
    },
  ], [t, navigationHelper, workspaceId, workbenchService, workspaceDialogService, onClose]);

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
      {/* M-10 修复：添加 ARIA 属性提升无障碍支持 */}
      <div className={styles.quickMenuOverlay} onClick={onClose} role="presentation" />
      <div className={styles.quickMenuPanel} role="dialog" aria-label="快速菜单">
        <div className={styles.quickMenuHeader}>
          {t['com.yunke.quick-menu.title']?.() || 'Quick Menu'}
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
