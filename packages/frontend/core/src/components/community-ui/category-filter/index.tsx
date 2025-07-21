import React, { useState, useCallback, useMemo } from 'react';
import type { CategoryInfo } from '../types';
import * as styles from './styles.css';

interface CategoryFilterProps {
  categories: CategoryInfo[];
  selectedCategoryId?: number;
  onCategoryChange: (categoryId?: number) => void;
  loading?: boolean;
  showSearch?: boolean;
  view?: 'grid' | 'list' | 'compact';
  allowViewToggle?: boolean;
  className?: string;
}

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  '技术': '💻',
  '设计': '🎨',
  '产品': '📱',
  '运营': '📊',
  '管理': '👔',
  '市场': '📈',
  '财务': '💰',
  '法务': '⚖️',
  '人力': '👥',
  '其他': '📋',
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  loading = false,
  showSearch = true,
  view: initialView = 'grid',
  allowViewToggle = true,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState(initialView);

  // 过滤分类
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // 获取分类图标
  const getCategoryIcon = useCallback((category: CategoryInfo) => {
    if (category.icon) return category.icon;
    return DEFAULT_CATEGORY_ICONS[category.name] || DEFAULT_CATEGORY_ICONS['其他'];
  }, []);

  const handleCategorySelect = useCallback((categoryId?: number) => {
    onCategoryChange(categoryId);
  }, [onCategoryChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const renderGridView = () => (
    <div className={styles.gridView}>
      {/* 全部分类选项 */}
      <div
        className={`${styles.categoryCard} ${styles.allCategoriesOption}`}
        data-selected={selectedCategoryId === undefined}
        onClick={() => handleCategorySelect(undefined)}
      >
        <div className={styles.categoryIcon}>📚</div>
        <div className={styles.categoryName}>全部分类</div>
        <div className={styles.categoryCount}>
          {categories.reduce((sum, cat) => sum + (cat.documentCount || 0), 0)}
        </div>
      </div>

      {filteredCategories.map(category => (
        <div
          key={category.id}
          className={styles.categoryCard}
          data-selected={selectedCategoryId === category.id}
          onClick={() => handleCategorySelect(category.id)}
          title={category.description}
        >
          <div className={styles.categoryIcon}>
            {getCategoryIcon(category)}
          </div>
          <div className={styles.categoryName}>{category.name}</div>
          <div className={styles.categoryCount}>
            {category.documentCount || 0}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className={styles.listView}>
      {/* 全部分类选项 */}
      <div
        className={`${styles.categoryListItem} ${styles.allCategoriesOption}`}
        data-selected={selectedCategoryId === undefined}
        onClick={() => handleCategorySelect(undefined)}
      >
        <div className={styles.listItemIcon}>📚</div>
        <div className={styles.listItemContent}>
          <div className={styles.listItemName}>全部分类</div>
          <div className={styles.listItemCount}>
            {categories.reduce((sum, cat) => sum + (cat.documentCount || 0), 0)}
          </div>
        </div>
      </div>

      {filteredCategories.map(category => (
        <div
          key={category.id}
          className={styles.categoryListItem}
          data-selected={selectedCategoryId === category.id}
          onClick={() => handleCategorySelect(category.id)}
          title={category.description}
        >
          <div className={styles.listItemIcon}>
            {getCategoryIcon(category)}
          </div>
          <div className={styles.listItemContent}>
            <div className={styles.listItemName}>{category.name}</div>
            <div className={styles.listItemCount}>
              {category.documentCount || 0}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompactView = () => (
    <div className={styles.compactView}>
      <button
        className={styles.compactCategory}
        data-selected={selectedCategoryId === undefined}
        onClick={() => handleCategorySelect(undefined)}
      >
        全部 ({categories.reduce((sum, cat) => sum + (cat.documentCount || 0), 0)})
      </button>

      {filteredCategories.map(category => (
        <button
          key={category.id}
          className={styles.compactCategory}
          data-selected={selectedCategoryId === category.id}
          onClick={() => handleCategorySelect(category.id)}
          title={category.description}
        >
          {getCategoryIcon(category)} {category.name} ({category.documentCount || 0})
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={`${styles.filterContainer} ${className || ''}`}>
        <div className={styles.loadingState}>
          加载分类中...
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`${styles.filterContainer} ${className || ''}`}>
        <div className={styles.emptyState}>
          暂无分类数据
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.filterContainer} ${className || ''}`}>
      {/* 头部控制栏 */}
      <div className={styles.filterHeader}>
        <div className={styles.filterTitle}>
          文档分类 {selectedCategoryId && `(${filteredCategories.find(c => c.id === selectedCategoryId)?.name})`}
        </div>
        {allowViewToggle && (
          <div className={styles.viewToggle}>
            <button
              className={styles.viewButton}
              data-active={currentView === 'grid'}
              onClick={() => setCurrentView('grid')}
              title="网格视图"
            >
              ⚏
            </button>
            <button
              className={styles.viewButton}
              data-active={currentView === 'list'}
              onClick={() => setCurrentView('list')}
              title="列表视图"
            >
              ☰
            </button>
            <button
              className={styles.viewButton}
              data-active={currentView === 'compact'}
              onClick={() => setCurrentView('compact')}
              title="紧凑视图"
            >
              ◫
            </button>
          </div>
        )}
      </div>

      {/* 搜索框 */}
      {showSearch && (
        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索分类..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {/* 分类列表 */}
      {filteredCategories.length === 0 && searchTerm ? (
        <div className={styles.emptyState}>
          没有找到匹配的分类
        </div>
      ) : (
        <>
          {currentView === 'grid' && renderGridView()}
          {currentView === 'list' && renderListView()}
          {currentView === 'compact' && renderCompactView()}
        </>
      )}
    </div>
  );
};

export default CategoryFilter;