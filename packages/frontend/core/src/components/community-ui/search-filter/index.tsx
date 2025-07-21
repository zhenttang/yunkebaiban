import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { SearchParams, CategoryInfo, TagInfo, SortOption } from '../types';
import { SORT_OPTIONS } from '../types';
import * as styles from './styles.css';

interface SearchFilterProps {
  onSearch: (params: SearchParams) => void;
  categories: CategoryInfo[];
  tags: TagInfo[];
  loading?: boolean;
  resultCount?: number;
  defaultParams?: Partial<SearchParams>;
  showAdvanced?: boolean;
}

const QUICK_FILTERS = [
  { key: 'all', label: '全部', params: {} },
  { key: 'free', label: '免费内容', params: { isPaid: false } },
  { key: 'paid', label: '付费内容', params: { isPaid: true } },
  { key: 'public', label: '公开文档', params: { isPublic: true } },
  { key: 'recent', label: '最近更新', params: { sortBy: 'updated_at' } },
];

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  categories,
  tags,
  loading = false,
  resultCount,
  defaultParams = {},
  showAdvanced = true,
}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: '',
    categoryId: undefined,
    tags: [],
    sortBy: 'created_at',
    ...defaultParams,
  });

  const [isExpanded, setIsExpanded] = useState(showAdvanced);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  const selectedTags = useMemo(() => {
    return tags.filter(tag => searchParams.tags?.includes(tag.id));
  }, [tags, searchParams.tags]);

  const handleKeywordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, keyword: e.target.value }));
  }, []);

  const handleKeywordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  }, [searchParams, onSearch]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value ? parseInt(e.target.value) : undefined;
    const newParams = { ...searchParams, categoryId };
    setSearchParams(newParams);
    setActiveQuickFilter('');
  }, [searchParams]);

  const handleSortChange = useCallback((sortBy: string) => {
    const newParams = { ...searchParams, sortBy };
    setSearchParams(newParams);
    setActiveQuickFilter('');
  }, [searchParams]);

  const handleTagToggle = useCallback((tagId: number) => {
    const currentTags = searchParams.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    const newParams = { ...searchParams, tags: newTags };
    setSearchParams(newParams);
    setActiveQuickFilter('');
  }, [searchParams]);

  const handleQuickFilter = useCallback((filterKey: string, filterParams: Partial<SearchParams>) => {
    const newParams = { ...searchParams, ...filterParams };
    setSearchParams(newParams);
    setActiveQuickFilter(filterKey);
    onSearch(newParams);
  }, [searchParams, onSearch]);

  const handleReset = useCallback(() => {
    const resetParams: SearchParams = {
      keyword: '',
      categoryId: undefined,
      tags: [],
      sortBy: 'created_at',
    };
    setSearchParams(resetParams);
    setPriceRange({ min: '', max: '' });
    setActiveQuickFilter('all');
    onSearch(resetParams);
  }, [onSearch]);

  const handleApplyFilters = useCallback(() => {
    onSearch(searchParams);
  }, [searchParams, onSearch]);

  const clearTags = useCallback(() => {
    const newParams = { ...searchParams, tags: [] };
    setSearchParams(newParams);
  }, [searchParams]);

  // 自动搜索（可选）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchParams.keyword !== defaultParams.keyword) {
        onSearch(searchParams);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams.keyword]);

  if (!isExpanded) {
    return (
      <div className={styles.collapsedState}>
        <form onSubmit={handleKeywordSubmit} className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索标题、内容、作者..."
            value={searchParams.keyword || ''}
            onChange={handleKeywordChange}
          />
          <button type="submit" className={styles.searchButton} disabled={loading}>
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>
        <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(true)}
        >
          显示高级筛选 ⬇️
        </button>
      </div>
    );
  }

  return (
    <div className={styles.filterContainer}>
      {/* 搜索框 */}
      <div className={styles.searchSection}>
        <form onSubmit={handleKeywordSubmit} className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索标题、内容、作者..."
            value={searchParams.keyword || ''}
            onChange={handleKeywordChange}
          />
          <button type="submit" className={styles.searchButton} disabled={loading}>
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>

        {/* 快速筛选 */}
        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map(filter => (
            <button
              key={filter.key}
              className={styles.quickFilterButton}
              data-active={activeQuickFilter === filter.key}
              onClick={() => handleQuickFilter(filter.key, filter.params)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排序选项 */}
      <div className={styles.sortSection}>
        <div className={styles.filterLabel}>排序方式</div>
        <div className={styles.sortOptions}>
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              className={styles.sortOption}
              data-active={searchParams.sortBy === option.value}
              onClick={() => handleSortChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 高级筛选 */}
      <div className={styles.filtersGrid}>
        {/* 分类筛选 */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>分类</label>
          <select
            className={styles.filterSelect}
            value={searchParams.categoryId || ''}
            onChange={handleCategoryChange}
          >
            <option value="">所有分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.documentCount || 0})
              </option>
            ))}
          </select>
        </div>

        {/* 价格范围 */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>价格范围</label>
          <div className={styles.priceRangeContainer}>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="最低价"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            />
            <span className={styles.priceSeparator}>-</span>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="最高价"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className={styles.tagsSection}>
          <div className={styles.tagsHeader}>
            <span className={styles.tagsTitle}>
              标签筛选 {selectedTags.length > 0 && `(已选 ${selectedTags.length})`}
            </span>
            {selectedTags.length > 0 && (
              <button className={styles.clearTagsButton} onClick={clearTags}>
                清除标签
              </button>
            )}
          </div>
          <div className={styles.tagsContainer}>
            {tags.slice(0, 20).map(tag => (
              <label 
                key={tag.id} 
                className={styles.tagCheckbox}
                data-selected={searchParams.tags?.includes(tag.id) || false}
              >
                <input
                  type="checkbox"
                  className={styles.tagCheckboxInput}
                  checked={searchParams.tags?.includes(tag.id) || false}
                  onChange={() => handleTagToggle(tag.id)}
                />
                <span 
                  className={styles.tagLabel}
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name} ({tag.usageCount})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={styles.actionsRow}>
        <div className={styles.resultCount}>
          {resultCount !== undefined && `找到 ${resultCount} 个结果`}
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.resetButton} onClick={handleReset}>
            重置筛选
          </button>
          <button className={styles.applyButton} onClick={handleApplyFilters} disabled={loading}>
            {loading ? '搜索中...' : '应用筛选'}
          </button>
          <button 
            className={styles.resetButton}
            onClick={() => setIsExpanded(false)}
          >
            收起 ⬆️
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;