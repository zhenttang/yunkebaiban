import { Button, usePromptModal } from '@yunke/component';
import {
  createDocExplorerContext,
  DocExplorerContext,
} from '@yunke/core/components/explorer/context';
import { DocsExplorer } from '@yunke/core/components/explorer/docs-view/docs-list';
import type { ExplorerDisplayPreference } from '@yunke/core/components/explorer/types';
import { Filters } from '@yunke/core/components/filter';
import {
  CollectionService,
  PinnedCollectionService,
} from '@yunke/core/modules/collection';
import { CollectionRulesService } from '@yunke/core/modules/collection-rules';
import type { FilterParams } from '@yunke/core/modules/collection-rules/types';
import { WorkspaceLocalState } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ViewBody,
  ViewHeader,
  ViewIcon,
  ViewTitle,
} from '../../../../modules/workbench';
import { AllDocSidebarTabs } from '../layouts/all-doc-sidebar-tabs';
import * as styles from './all-page.css';
import { AllDocsHeader } from './all-page-header';
import { MigrationAllDocsDataNotification } from './migration-data';
import { PinnedCollections } from './pinned-collections';

const DefaultDisplayPreference: {
  [key in ViewMode]: ExplorerDisplayPreference;
} = {
  grid: {
    view: 'grid',
    displayProperties: [
      'system:createdAt',
      'system:updatedAt',
      'system:createdBy',
      'system:tags',
    ],
    orderBy: {
      type: 'system',
      key: 'updatedAt',
      desc: true,
    },
    groupBy: undefined,
    showDocIcon: true,
    showDocPreview: true,
    quickFavorite: true,
    showDragHandle: true,
    showMoreOperation: true,
  },
  masonry: {
    view: 'masonry',
    displayProperties: [
      'system:createdAt',
      'system:updatedAt',
      'system:createdBy',
      'system:tags',
    ],
    orderBy: {
      type: 'system',
      key: 'updatedAt',
      desc: true,
    },
    groupBy: undefined,
    showDocIcon: true,
    showDocPreview: true,
    quickFavorite: true,
    showDragHandle: true,
    showMoreOperation: true,
  },
  list: {
    view: 'list',
    displayProperties: [
      'system:createdAt',
      'system:updatedAt',
      'system:createdBy',
      'system:tags',
    ],
    orderBy: {
      type: 'system',
      key: 'updatedAt',
      desc: true,
    },
    groupBy: {
      type: 'system',
      key: 'updatedAt',
    },
    showDocIcon: true,
    showDocPreview: true,
    quickFavorite: true,
    showDragHandle: true,
    showMoreOperation: true,
  },
};

type ViewMode = NonNullable<ExplorerDisplayPreference['view']>;

export const AllPage = () => {
  const t = useI18n();

  const collectionService = useService(CollectionService);
  const pinnedCollectionService = useService(PinnedCollectionService);
  const {
    viewMode,
    setViewMode,
    selectedCollectionId,
    setSelectedCollectionId,
    displayPreference,
    setDisplayPreference,
  } = useAllDocsOptions();

  const isCollectionDataReady = useLiveData(
    collectionService.collectionDataReady$
  );

  const isPinnedCollectionDataReady = useLiveData(
    pinnedCollectionService.pinnedCollectionDataReady$
  );

  const pinnedCollections = useLiveData(
    pinnedCollectionService.pinnedCollections$
  );

  const selectedCollection = useLiveData(
    selectedCollectionId
      ? collectionService.collection$(selectedCollectionId)
      : null
  );

  useEffect(() => {
    // if selected collection is not in pinned collections, set selected collection id to null
    if (
      isPinnedCollectionDataReady &&
      selectedCollectionId &&
      !pinnedCollections.some(c => c.collectionId === selectedCollectionId)
    ) {
      setSelectedCollectionId(null);
    }
  }, [
    isPinnedCollectionDataReady,
    pinnedCollections,
    selectedCollectionId,
    setSelectedCollectionId,
  ]);

  useEffect(() => {
    // if selected collection is not found, set selected collection id to null
    if (!selectedCollection && selectedCollectionId && isCollectionDataReady) {
      setSelectedCollectionId(null);
    }
  }, [
    isCollectionDataReady,
    selectedCollection,
    selectedCollectionId,
    setSelectedCollectionId,
  ]);

  const selectedCollectionInfo = useLiveData(
    selectedCollection ? selectedCollection.info$ : null
  );

  const [tempFilters, setTempFilters] = useState<FilterParams[] | null>(null);
  const [tempFiltersInitial, setTempFiltersInitial] =
    useState<FilterParams | null>(null);

  const [explorerContextValue] = useState(() =>
    createDocExplorerContext(displayPreference)
  );

  useEffect(() => {
    explorerContextValue.displayPreference$.next(displayPreference);
  }, [displayPreference, explorerContextValue]);

  const groupBy = displayPreference.groupBy;
  const orderBy = displayPreference.orderBy;

  const { openPromptModal } = usePromptModal();

  const collectionRulesService = useService(CollectionRulesService);
  // 使用 ref 跟踪订阅，确保在切换时正确清理
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  // 使用 ref 保存当前的 groups，用于在切换时保留数据
  const currentGroupsRef = useRef<Array<{ key: string; items: string[] }>>([]);

  // 🔧 性能优化：稳定 watchParams 引用，避免对象每次渲染都重新创建
  const watchParams = useMemo(() => {
    const extraFilters = [
      {
        type: 'system' as const,
        key: 'empty-journal',
        method: 'is' as const,
        value: 'false',
      },
      {
        type: 'system' as const,
        key: 'trash',
        method: 'is' as const,
        value: 'false',
      },
    ];

    if (selectedCollectionInfo) {
      return {
        filters: selectedCollectionInfo.rules.filters,
        groupBy,
        orderBy,
        extraAllowList: selectedCollectionInfo.allowList,
        extraFilters,
      };
    }

    return {
      filters:
        tempFilters && tempFilters.length > 0
          ? tempFilters
          : [
              {
                type: 'system' as const,
                key: 'trash',
                method: 'is' as const,
                value: 'false',
              },
            ],
      groupBy,
      orderBy,
      extraFilters,
    };
  }, [groupBy, orderBy, selectedCollectionInfo, tempFilters]);

  useEffect(() => {
    // 先取消旧的订阅
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // 保存当前的 groups，以便在切换时保留
    const savedGroups = explorerContextValue.groups$.value;
    if (savedGroups && savedGroups.length > 0) {
      currentGroupsRef.current = savedGroups;
    }

    const subscription = collectionRulesService
      .watch(watchParams)
      .subscribe({
        next: result => {
          // 订阅返回数据时立即更新，确保视图切换时数据及时更新
          if (result && result.groups !== undefined) {
            explorerContextValue.groups$.next(result.groups);
            currentGroupsRef.current = result.groups;
          }
        },
        error: error => {
          console.error(error);
        },
      });

    subscriptionRef.current = subscription;

    return () => {
      // 清理时取消订阅
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
    // 🔧 性能优化：watchParams 已 memoized，只在实际参数变化时触发
  }, [collectionRulesService, explorerContextValue, watchParams]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        explorerContextValue.selectMode$.next(false);
        explorerContextValue.selectedDocIds$.next([]);
        explorerContextValue.prevCheckAnchorId$.next(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [explorerContextValue]);

  const handleFilterChange = useCallback((filters: FilterParams[]) => {
    setTempFilters(filters);
  }, []);

  const handleSelectCollection = useCallback(
    (collectionId: string) => {
      setSelectedCollectionId(collectionId);
      setTempFilters(null);
    },
    [setSelectedCollectionId]
  );

  const handleSelectAll = useCallback(() => {
    setSelectedCollectionId(null);
    setTempFilters(null);
  }, [setSelectedCollectionId]);

  const handleSaveFilters = useCallback(() => {
    if (selectedCollectionId) {
      collectionService.updateCollection(selectedCollectionId, {
        rules: {
          filters: tempFilters ?? [],
        },
      });
      setTempFilters(null);
    } else {
      openPromptModal({
        title: t['com.yunke.editCollection.saveCollection'](),
        label: t['com.yunke.editCollectionName.name'](),
        inputOptions: {
          placeholder: t['com.yunke.editCollectionName.name.placeholder'](),
        },
        children: t['com.yunke.editCollectionName.createTips'](),
        confirmText: t['com.yunke.editCollection.save'](),
        cancelText: t['com.yunke.editCollection.button.cancel'](),
        confirmButtonOptions: {
          variant: 'primary',
        },
        onConfirm(name) {
          const id = collectionService.createCollection({
            name,
            rules: {
              filters: tempFilters ?? [],
            },
          });
          pinnedCollectionService.addPinnedCollection({
            collectionId: id,
            index: pinnedCollectionService.indexAt('after'),
          });
          setTempFilters(null);
          setSelectedCollectionId(id);
        },
      });
    }
  }, [
    collectionService,
    openPromptModal,
    pinnedCollectionService,
    selectedCollectionId,
    setSelectedCollectionId,
    t,
    tempFilters,
  ]);

  const handleNewTempFilter = useCallback(
    (params: FilterParams) => {
      setSelectedCollectionId(null);
      setTempFilters([]);
      setTempFiltersInitial(params);
    },
    [setSelectedCollectionId]
  );

  const handleDisplayPreferenceChange = useCallback(
    (displayPreference: ExplorerDisplayPreference) => {
      setDisplayPreference(displayPreference);
    },
    [setDisplayPreference]
  );

  const filterSummaryText = useMemo(() => {
    const activeFilters =
      tempFilters ?? (selectedCollectionInfo?.rules.filters ?? []);
    const count = activeFilters.length;
    if (count > 0) {
      return `${count} ${t['com.yunke.filter']()}`;
    }
    return t['com.yunke.filterList.button.add']();
  }, [selectedCollectionInfo, tempFilters, t]);

  return (
    <DocExplorerContext.Provider value={explorerContextValue}>
      <ViewTitle title={t['All pages']()} />
      <ViewIcon icon="allDocs" />
      <ViewHeader>
        <AllDocsHeader
          displayPreference={displayPreference}
          onDisplayPreferenceChange={handleDisplayPreferenceChange}
          view={viewMode}
          onViewChange={setViewMode}
        />
      </ViewHeader>
      <ViewBody>
        <div className={styles.body}>
          <div className={styles.mainContainer}>
            <div className={styles.banner}>
              <MigrationAllDocsDataNotification />
            </div>

            <section className={styles.pinnedCard}>
              <PinnedCollections
                activeCollectionId={selectedCollectionId}
                onActiveAll={handleSelectAll}
                onActiveCollection={handleSelectCollection}
                onAddFilter={handleNewTempFilter}
                hiddenAdd={tempFilters !== null}
              />
            </section>

            <section className={styles.filterCard}>
              <div className={styles.filterHeader}>
                <div>
                  <div className={styles.sectionTitle}>{t['com.yunke.filter']()}</div>
                  <div className={styles.filterSummary}>{filterSummaryText}</div>
                </div>
                {tempFilters === null ? (
                  <Button
                    variant="plain"
                    size="default"
                    onClick={() => {
                      const baseFilters = selectedCollectionInfo?.rules.filters ?? [];
                      setTempFilters([...baseFilters]);
                      setTempFiltersInitial(null);
                    }}
                  >
                    {t['com.yunke.filterList.button.add']()}
                  </Button>
                ) : null}
              </div>
              {tempFilters !== null ? (
                <div className={styles.filterContent}>
                  <Filters
                    key={selectedCollectionId ?? 'all'}
                    className={styles.filters}
                    filters={tempFilters}
                    onChange={handleFilterChange}
                    defaultDraftFilter={tempFiltersInitial}
                  />
                  <div className={styles.filterControls}>
                    <Button
                      variant="plain"
                      onClick={() => {
                        setTempFilters(null);
                        setTempFiltersInitial(null);
                      }}
                    >
                      {t['Cancel']()}
                    </Button>
                    <div className={styles.filterActionsSpacer} />
                    <Button onClick={handleSaveFilters}>{t['save']()}</Button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className={styles.documentsContainer}>
              <div className={styles.documentsInner}>
                <DocsExplorer />
              </div>
            </section>
          </div>
        </div>
      </ViewBody>
      <AllDocSidebarTabs />
    </DocExplorerContext.Provider>
  );
};

export const Component = () => {
  return <AllPage />;
};

/**
 * Since split view allows users to open multiple all docs simultaneously, each with its own state,
 * we only read the stored state once during useState initialization to maintain independent states.
 */
const useAllDocsOptions = () => {
  const workspaceLocalState = useService(WorkspaceLocalState);

  const readSavedViewMode = useCallback(() => {
    return workspaceLocalState.get<ViewMode>('allDocsMode') ?? 'list';
  }, [workspaceLocalState]);

  const readSavedDisplayPreference = useCallback(
    (mode: ViewMode) => {
      const saved = workspaceLocalState.get<ExplorerDisplayPreference>(
        'allDocsDisplayPreference:' + mode
      );
      return {
        ...DefaultDisplayPreference[mode],
        ...saved,
        view: mode,
      };
    },
    [workspaceLocalState]
  );

  const [viewMode, setViewMode] = useState(readSavedViewMode);
  const [displayPreference, setDisplayPreference] =
    useState<ExplorerDisplayPreference>(() =>
      readSavedDisplayPreference(viewMode)
    );
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    () =>
      workspaceLocalState.get<string | null>('allDocsSelectedCollectionId') ??
      null
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      workspaceLocalState.set('allDocsMode', mode);
      setViewMode(mode);
      setDisplayPreference(readSavedDisplayPreference(mode));
    },
    [workspaceLocalState, readSavedDisplayPreference]
  );

  const handleDisplayPreferenceChange = useCallback(
    (displayPreference: ExplorerDisplayPreference) => {
      workspaceLocalState.set(
        'allDocsDisplayPreference:' + viewMode,
        displayPreference
      );
      setDisplayPreference(displayPreference);
    },
    [viewMode, workspaceLocalState]
  );

  const handleSelectedCollectionIdChange = useCallback(
    (collectionId: string | null) => {
      workspaceLocalState.set('allDocsSelectedCollectionId', collectionId);
      setSelectedCollectionId(collectionId);
    },
    [workspaceLocalState]
  );

  return {
    viewMode,
    setViewMode: handleViewModeChange,
    displayPreference,
    setDisplayPreference: handleDisplayPreferenceChange,
    selectedCollectionId,
    setSelectedCollectionId: handleSelectedCollectionIdChange,
  };
};
