import {
  Button,
  SafeArea,
  startScopedViewTransition,
  useThemeColorV2,
} from '@yunke/component';
import { CollectionService } from '@yunke/core/modules/collection';
import {
  type QuickSearchItem,
  QuickSearchTagIcon,
} from '@yunke/core/modules/quicksearch';
import { TagService } from '@yunke/core/modules/tag';
import { useI18n } from '@yunke/i18n';
import { sleep } from '@blocksuite/yunke/global/utils';
import { ViewLayersIcon } from '@blocksuite/icons/rc';
import {
  LiveData,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import { bodyEmphasized } from '@toeverything/theme/typography';
import { useCallback, useMemo } from 'react';

import {
  NavigationBackButton,
  SearchInput,
  SearchResLabel,
} from '../../components';
import { searchVTScope } from '../../components/search-input/style.css';
import { MobileSearchService } from '../../modules/search';
import { SearchResults } from '../../views/search/search-results';
import * as styles from '../../views/search/style.css';

const searchInput$ = new LiveData('');

const RecentList = () => {
  const { mobileSearchService, collectionService, tagService } = useServices({
    MobileSearchService,
    CollectionService,
    TagService,
  });
  const recentDocsList = useLiveData(mobileSearchService.recentDocs.items$);
  const collectionMetas = useLiveData(collectionService.collectionMetas$);
  const tags = useLiveData(
    LiveData.computed(get =>
      get(tagService.tagList.tags$).map(tag => ({
        id: tag.id,
        title: get(tag.value$),
        color: get(tag.color$),
      }))
    )
  );

  const docs = useMemo(
    () =>
      recentDocsList.map(item => ({
        id: item.payload.docId,
        icon: item.icon,
        title: <SearchResLabel item={item} />,
      })),
    [recentDocsList]
  );

  const collectionList = useMemo(() => {
    return collectionMetas.slice(0, 3).map(item => {
      return {
        id: 'collection:' + item.id,
        source: 'collection',
        label: { title: item.name },
        icon: <ViewLayersIcon />,
        payload: { collectionId: item.id },
      } satisfies QuickSearchItem<'collection', { collectionId: string }>;
    });
  }, [collectionMetas]);

  const tagList = useMemo(() => {
    return tags
      .reverse()
      .slice(0, 3)
      .map(item => {
        return {
          id: 'tag:' + item.id,
          source: 'tag',
          label: { title: item.title },
          icon: <QuickSearchTagIcon color={item.color} />,
          payload: { tagId: item.id },
        } satisfies QuickSearchItem<'tag', { tagId: string }>;
      });
  }, [tags]);

  return (
    <SearchResults
      title="最近访问"
      docs={docs}
      collections={collectionList}
      tags={tagList}
    />
  );
};

const WithQueryList = () => {
  const searchService = useService(MobileSearchService);
  const collectionList = useLiveData(searchService.collections.items$);
  const docList = useLiveData(searchService.docs.items$);
  const tagList = useLiveData(searchService.tags.items$);

  const docs = useMemo(
    () =>
      docList.map(item => ({
        id: item.payload.docId,
        icon: item.icon,
        title: <SearchResLabel item={item} />,
      })),
    [docList]
  );

  return (
    <SearchResults
              title="搜索结果"
      docs={docs}
      collections={collectionList}
      tags={tagList}
    />
  );
};

export const Component = () => {
  const t = useI18n();
  useThemeColorV2('layer/background/mobile/primary');
  const searchInput = useLiveData(searchInput$);
  const searchService = useService(MobileSearchService);

  const onSearch = useCallback(
    (v: string) => {
      searchInput$.next(v);
      searchService.recentDocs.query(v);
      searchService.collections.query(v);
      searchService.docs.query(v);
      searchService.tags.query(v);
    },
    [
      searchService.collections,
      searchService.docs,
      searchService.recentDocs,
      searchService.tags,
    ]
  );

  const transitionBack = useCallback(() => {
    startScopedViewTransition(searchVTScope, async () => {
      history.back();
      await sleep(10);
    });
  }, []);

  return (
    <>
      <SafeArea top>
        <div className={styles.searchHeader} data-testid="search-header">
          <SearchInput
            className={styles.searchInput}
            debounce={300}
            autoFocus={!searchInput}
            value={searchInput}
            onInput={onSearch}
            placeholder="搜索文档、集合"
          />
          <NavigationBackButton>
            <Button
              variant="plain"
              className={styles.searchCancel}
              onClick={transitionBack}
            >
              <span className={bodyEmphasized}>{t['Cancel']()}</span>
            </Button>
          </NavigationBackButton>
        </div>
      </SafeArea>
      {searchInput ? <WithQueryList /> : <RecentList />}
    </>
  );
};
