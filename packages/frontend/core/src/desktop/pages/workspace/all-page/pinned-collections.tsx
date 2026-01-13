import {
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@yunke/component';
import { AddFilterMenu } from '@yunke/core/components/filter/add-filter';
import {
  CollectionService,
  type PinnedCollectionRecord,
  PinnedCollectionService,
} from '@yunke/core/modules/collection';
import type { FilterParams } from '@yunke/core/modules/collection-rules';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import {
  CloseIcon,
  CollectionsIcon,
  EditIcon,
  FilterIcon,
  PlusIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useMemo, useState } from 'react';

import * as styles from './pinned-collections.css';

export const PinnedCollectionItem = ({
  record,
  isActive,
  onClick,
  onClickRemove,
}: {
  record: PinnedCollectionRecord;
  onClickRemove: () => void;
  isActive: boolean;
  onClick: () => void;
}) => {
  const t = useI18n();
  const collectionService = useService(CollectionService);
  const collection = useLiveData(
    collectionService.collection$(record.collectionId)
  );
  const name = useLiveData(collection?.name$);
  if (!collection) {
    return null;
  }
  return (
    <div
      className={styles.pill}
      data-active={isActive ? 'true' : undefined}
      role="button"
      onClick={onClick}
    >
      <span className={styles.pillLabel}>{name ?? t['Untitled']()}</span>
      <span className={styles.pillIndicator} />
      {isActive && (
        <IconButton
          className={styles.iconButton}
          size="16"
          onClick={e => {
            e.stopPropagation();
            onClickRemove();
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </div>
  );
};

export const PinnedCollections = ({
  activeCollectionId,
  onActiveAll,
  onActiveCollection,
  onAddFilter,
  hiddenAdd,
}: {
  activeCollectionId: string | null;
  onActiveAll: () => void;
  onActiveCollection: (collectionId: string) => void;
  onAddFilter: (params: FilterParams) => void;
  hiddenAdd?: boolean;
}) => {
  const t = useI18n();
  const workspaceDialogService = useService(WorkspaceDialogService);
  const pinnedCollectionService = useService(PinnedCollectionService);
  const pinnedCollections = useLiveData(
    pinnedCollectionService.sortedPinnedCollections$
  );

  const handleAddPinnedCollection = (collectionId: string) => {
    pinnedCollectionService.addPinnedCollection({
      collectionId,
      index: pinnedCollectionService.indexAt('after'),
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        <div
          className={styles.pill}
          data-active={activeCollectionId === null ? 'true' : undefined}
          onClick={() => {
            if (activeCollectionId !== null) {
              track.allDocs.header.navigation.navigatePinedCollectionRouter({
                control: 'all',
              });
              onActiveAll();
            }
          }}
          role="button"
        >
          <span className={styles.pillLabel}>
            {t['com.yunke.all-docs.pinned-collection.all']()}
          </span>
          <span className={styles.pillIndicator} />
        </div>
        {pinnedCollections.map((record, index) => (
          <PinnedCollectionItem
            key={record.collectionId}
            record={record}
            isActive={activeCollectionId === record.collectionId}
            onClick={() => {
              if (activeCollectionId !== record.collectionId) {
                track.allDocs.header.navigation.navigatePinedCollectionRouter({
                  control: 'user-custom-collection',
                });
                onActiveCollection(record.collectionId);
              }
            }}
            onClickRemove={() => {
              const nextCollectionId = pinnedCollections[index - 1]?.collectionId;
              if (nextCollectionId) {
                onActiveCollection(nextCollectionId);
              } else {
                onActiveAll();
              }
              pinnedCollectionService.removePinnedCollection(record.collectionId);
            }}
          />
        ))}
      </div>
      <div className={styles.trailingActions}>
        {!hiddenAdd && (
          <AddPinnedCollection
            onPinCollection={handleAddPinnedCollection}
            onAddFilter={onAddFilter}
          />
        )}
        {activeCollectionId && (
          <Tooltip content={t['com.yunke.all-docs.pinned-collection.edit']()}>
            <IconButton
              size="16"
              className={styles.iconButton}
              onClick={() => {
                track.allDocs.header.collection.editCollection();
                workspaceDialogService.open('collection-editor', {
                  collectionId: activeCollectionId,
                });
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export const AddPinnedCollection = ({
  onPinCollection,
  onAddFilter,
}: {
  onPinCollection: (collectionId: string) => void;
  onAddFilter: (params: FilterParams) => void;
}) => {
  const t = useI18n();
  return (
    <Menu
      items={
        <AddPinnedCollectionMenuContent
          onPinCollection={onPinCollection}
          onAddFilter={onAddFilter}
        />
      }
    >
      <button type="button" className={styles.addButton}>
        <PlusIcon />
        {t['com.yunke.filter.add-filter']()}
      </button>
    </Menu>
  );
};

export const AddPinnedCollectionMenuContent = ({
  onPinCollection,
  onAddFilter,
}: {
  onPinCollection: (collectionId: string) => void;
  onAddFilter: (params: FilterParams) => void;
}) => {
  const [addingFilter, setAddingFilter] = useState<boolean>(false);
  const collectionService = useService(CollectionService);
  const collectionMetas = useLiveData(collectionService.collectionMetas$);
  const pinnedCollectionService = useService(PinnedCollectionService);
  const pinnedCollections = useLiveData(
    pinnedCollectionService.pinnedCollections$
  );

  const unpinnedCollectionMetas = useMemo(
    () =>
      collectionMetas.filter(
        meta =>
          !pinnedCollections.some(
            collection => collection.collectionId === meta.id
          )
      ),
    [pinnedCollections, collectionMetas]
  );

  const t = useI18n();

  return !addingFilter ? (
    <>
      <MenuItem
        prefixIcon={<FilterIcon />}
        onClick={e => {
          // prevent default to avoid closing the menu
          e.preventDefault();
          setAddingFilter(true);
        }}
      >
        {t['com.yunke.filter']()}
      </MenuItem>
      {unpinnedCollectionMetas.length > 0 && <Divider />}
      {unpinnedCollectionMetas.map(meta => (
        <MenuItem
          key={meta.id}
          prefixIcon={<CollectionsIcon />}
          suffixIcon={<PlusIcon />}
          onClick={() => {
            track.allDocs.header.collection.addPinnedCollection();
            onPinCollection(meta.id);
          }}
        >
          {meta.name ?? t['Untitled']()}
        </MenuItem>
      ))}
    </>
  ) : (
    <AddFilterMenu onBack={() => setAddingFilter(false)} onAdd={onAddFilter} />
  );
};
