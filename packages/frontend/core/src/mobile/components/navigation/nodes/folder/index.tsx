import {
  AnimatedFolderIcon,
  IconButton,
  MenuItem,
  MenuSeparator,
  MenuSub,
  notify,
} from '@yunke/component';
import { usePageHelper } from '@yunke/core/blocksuite/block-suite-page-list/utils';
import type {
  NavigationPanelTreeNodeIcon,
  NodeOperation,
} from '@yunke/core/desktop/components/navigation-panel';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { CompatibleFavoriteItemsAdapter } from '@yunke/core/modules/favorite';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import {
  type FolderNode,
  OrganizeService,
} from '@yunke/core/modules/organize';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import {
  DeleteIcon,
  FolderIcon,
  LayerIcon,
  PageIcon,
  PlusIcon,
  PlusThickIcon,
  RemoveFolderIcon,
  TagsIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useServices } from '@toeverything/infra';
import { difference } from 'lodash-es';
import { useCallback, useMemo, useState } from 'react';

import { AddItemPlaceholder } from '../../layouts/add-item-placeholder';
import { NavigationPanelTreeNode } from '../../tree/node';
import { NavigationPanelCollectionNode } from '../collection';
import { NavigationPanelDocNode } from '../doc';
import { NavigationPanelTagNode } from '../tag';
import { FolderCreateTip, FolderRenameSubMenu } from './dialog';
import { FavoriteFolderOperation } from './operations';

export const NavigationPanelFolderNode = ({
  nodeId,
  operations,
}: {
  nodeId: string;
  operations?:
    | NodeOperation[]
    | ((type: string, node: FolderNode) => NodeOperation[]);
}) => {
  const { organizeService } = useServices({
    OrganizeService,
  });
  const node = useLiveData(organizeService.folderTree.folderNode$(nodeId));
  const type = useLiveData(node?.type$);
  const data = useLiveData(node?.data$);

  const additionalOperations = useMemo(() => {
    if (!type || !node) {
      return;
    }
    if (typeof operations === 'function') {
      return operations(type, node);
    }
    return operations;
  }, [node, operations, type]);

  if (!node) {
    return;
  }

  if (type === 'folder') {
    return (
      <NavigationPanelFolderNodeFolder
        node={node}
        operations={additionalOperations}
      />
    );
  }
  if (!data) return null;
  if (type === 'doc') {
    return (
      <NavigationPanelDocNode docId={data} operations={additionalOperations} />
    );
  } else if (type === 'collection') {
    return (
      <NavigationPanelCollectionNode
        collectionId={data}
        operations={additionalOperations}
      />
    );
  } else if (type === 'tag') {
    return (
      <NavigationPanelTagNode tagId={data} operations={additionalOperations} />
    );
  }

  return;
};

const NavigationPanelFolderIcon: NavigationPanelTreeNodeIcon = ({
  collapsed,
  className,
  draggedOver,
  treeInstruction,
}) => (
  <AnimatedFolderIcon
    className={className}
    open={
      !collapsed || (!!draggedOver && treeInstruction?.type === 'make-child')
    }
  />
);

const NavigationPanelFolderNodeFolder = ({
  node,
  operations: additionalOperations,
}: {
  node: FolderNode;
  operations?: NodeOperation[];
}) => {
  const t = useI18n();
  const { workspaceService, featureFlagService, workspaceDialogService } =
    useServices({
      WorkspaceService,
      CompatibleFavoriteItemsAdapter,
      FeatureFlagService,
      WorkspaceDialogService,
    });
  const name = useLiveData(node.name$);
  const enableEmojiIcon = useLiveData(
    featureFlagService?.flags?.enable_emoji_folder_icon?.$ || null
  );
  const [collapsed, setCollapsed] = useState(true);

  const { createPage } = usePageHelper(
    workspaceService.workspace.docCollection
  );
  const handleDelete = useCallback(() => {
    node.delete();
    track.$.navigationPanel.organize.deleteOrganizeItem({
      type: 'folder',
    });
    notify.success({
      title: t['com.yunke.rootAppSidebar.organize.delete.notify-title']({
        name,
      }),
      message: t['com.yunke.rootAppSidebar.organize.delete.notify-message'](),
    });
  }, [name, node, t]);

  const children = useLiveData(node.sortedChildren$);

  const handleRename = useCallback(
    (newName: string) => {
      node.rename(newName);
    },
    [node]
  );

  const handleNewDoc = useCallback(() => {
    const newDoc = createPage();
    node.createLink('doc', newDoc.id, node.indexAt('before'));
    track.$.navigationPanel.folders.createDoc();
    track.$.navigationPanel.organize.createOrganizeItem({
      type: 'link',
      target: 'doc',
    });
    setCollapsed(false);
  }, [createPage, node]);

  const handleCreateSubfolder = useCallback(
    (name: string) => {
      node.createFolder(name, node.indexAt('before'));
      track.$.navigationPanel.organize.createOrganizeItem({ type: 'folder' });
      setCollapsed(false);
    },
    [node]
  );

  const handleAddToFolder = useCallback(
    (type: 'doc' | 'collection' | 'tag') => {
      const initialIds = children
        .filter(node => node.type$.value === type)
        .map(node => node.data$.value)
        .filter(Boolean) as string[];
      const selector =
        type === 'doc'
          ? 'doc-selector'
          : type === 'collection'
            ? 'collection-selector'
            : 'tag-selector';
      workspaceDialogService.open(
        selector,
        {
          init: initialIds,
        },
        selectedIds => {
          if (selectedIds === undefined) {
            return;
          }
          const newItemIds = difference(selectedIds, initialIds);
          const removedItemIds = difference(initialIds, selectedIds);
          const removedItems = children.filter(
            node =>
              !!node.data$.value && removedItemIds.includes(node.data$.value)
          );

          newItemIds.forEach(id => {
            node.createLink(type, id, node.indexAt('after'));
          });
          removedItems.forEach(node => node.delete());
          const updated = newItemIds.length + removedItems.length;
          updated && setCollapsed(false);
        }
      );
      track.$.navigationPanel.organize.createOrganizeItem({
        type: 'link',
        target: type,
      });
    },
    [children, node, workspaceDialogService]
  );

  const createSubTipRenderer = useCallback(
    ({ input }: { input: string }) => {
      return <FolderCreateTip input={input} parentName={name} />;
    },
    [name]
  );

  const folderOperations = useMemo(() => {
    return [
      {
        index: 0,
        inline: true,
        view: (
          <IconButton
            size="16"
            onClick={handleNewDoc}
            tooltip={t[
              'com.yunke.rootAppSidebar.explorer.organize-add-tooltip'
            ]()}
          >
            <PlusIcon />
          </IconButton>
        ),
      },
      {
        index: 98,
        view: (
          <FolderRenameSubMenu
            initialName={name}
            onConfirm={handleRename}
            menuProps={{
              triggerOptions: { 'data-testid': 'rename-folder' },
            }}
          />
        ),
      },
      {
        index: 99,
        view: <MenuSeparator />,
      },
      {
        index: 100,
        view: (
          <FolderRenameSubMenu
            text={t[
              'com.yunke.rootAppSidebar.organize.folder.create-subfolder'
            ]()}
            title={t[
              'com.yunke.rootAppSidebar.organize.folder.create-subfolder'
            ]()}
            onConfirm={handleCreateSubfolder}
            descRenderer={createSubTipRenderer}
            icon={<FolderIcon />}
            menuProps={{
              triggerOptions: { 'data-testid': 'create-subfolder' },
            }}
          />
        ),
      },
      {
        index: 102,
        view: (
          <MenuSub
            triggerOptions={{
              prefixIcon: <PlusThickIcon />,
            }}
            items={
              <>
                <MenuItem
                  prefixIcon={<PageIcon />}
                  onClick={() => handleAddToFolder('doc')}
                >
                  {t['com.yunke.rootAppSidebar.organize.folder.add-docs']()}
                </MenuItem>
                <MenuItem
                  onClick={() => handleAddToFolder('tag')}
                  prefixIcon={<TagsIcon />}
                >
                  {t['com.yunke.rootAppSidebar.organize.folder.add-tags']()}
                </MenuItem>
                <MenuItem
                  onClick={() => handleAddToFolder('collection')}
                  prefixIcon={<LayerIcon />}
                >
                  {t[
                    'com.yunke.rootAppSidebar.organize.folder.add-collections'
                  ]()}
                </MenuItem>
              </>
            }
          >
            {t['com.yunke.rootAppSidebar.organize.folder.add-others']()}
          </MenuSub>
        ),
      },

      {
        index: 200,
        view: node.id ? <FavoriteFolderOperation id={node.id} /> : null,
      },

      {
        index: 9999,
        view: <MenuSeparator key="menu-separator" />,
      },
      {
        index: 10000,
        view: (
          <MenuItem
            type={'danger'}
            prefixIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            {t['com.yunke.rootAppSidebar.organize.delete']()}
          </MenuItem>
        ),
      },
    ];
  }, [
    createSubTipRenderer,
    handleAddToFolder,
    handleCreateSubfolder,
    handleDelete,
    handleNewDoc,
    handleRename,
    name,
    node.id,
    t,
  ]);

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...additionalOperations, ...folderOperations];
    }
    return folderOperations;
  }, [additionalOperations, folderOperations]);

  const childrenOperations = useCallback(
    (type: string, node: FolderNode) => {
      if (type === 'doc' || type === 'collection' || type === 'tag') {
        return [
          {
            index: 999,
            view: (
              <MenuItem
                type={'danger'}
                prefixIcon={<RemoveFolderIcon />}
                data-event-props="$.navigationPanel.organize.deleteOrganizeItem"
                data-event-args-type={node.type$.value}
                onClick={() => node.delete()}
              >
                {t['com.yunke.rootAppSidebar.organize.delete-from-folder']()}
              </MenuItem>
            ),
          },
        ] satisfies NodeOperation[];
      }
      return [];
    },
    [t]
  );

  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    if (collapsed) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, []);

  return (
    <NavigationPanelTreeNode
      icon={NavigationPanelFolderIcon}
      name={name}
      extractEmojiAsIcon={enableEmojiIcon}
      collapsed={collapsed}
      setCollapsed={handleCollapsedChange}
      operations={finalOperations}
      data-testid={`navigation-panel-folder-${node.id}`}
      aria-label={name}
      data-role="navigation-panel-folder"
    >
      {children.map(child => (
        <NavigationPanelFolderNode
          key={child.id}
          nodeId={child.id as string}
          operations={childrenOperations}
        />
      ))}
      <AddItemPlaceholder
        label={t['com.yunke.rootAppSidebar.organize.folder.new-doc']()}
        onClick={handleNewDoc}
        data-testid="new-folder-in-folder-button"
      />
    </NavigationPanelTreeNode>
  );
};
