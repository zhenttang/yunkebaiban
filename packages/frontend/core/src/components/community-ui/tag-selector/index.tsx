import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TagInfo } from '../types';
import * as styles from './styles.css';

interface TagSelectorProps {
  selectedTags: TagInfo[];
  availableTags: TagInfo[];
  onTagsChange: (tags: TagInfo[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<TagInfo>;
  maxTags?: number;
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  '#f50', '#2db7f5', '#87d068', '#108ee9', '#f04134',
  '#00a2ae', '#fa8c16', '#722ed1', '#eb2f96', '#52c41a',
];

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  availableTags,
  onTagsChange,
  onCreateTag,
  maxTags = 10,
  placeholder = "搜索或创建标签...",
  allowCreate = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 过滤可用标签
  const filteredTags = useMemo(() => {
    const selectedIds = selectedTags.map(tag => tag.id);
    return availableTags
      .filter(tag => !selectedIds.includes(tag.id))
      .filter(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.usageCount - a.usageCount);
  }, [availableTags, selectedTags, searchTerm]);

  // 检查是否可以创建新标签
  const canCreateNew = useMemo(() => {
    return allowCreate && 
           onCreateTag && 
           searchTerm.trim() && 
           !filteredTags.some(tag => tag.name.toLowerCase() === searchTerm.toLowerCase());
  }, [allowCreate, onCreateTag, searchTerm, filteredTags]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagSelect = useCallback((tag: TagInfo) => {
    if (selectedTags.length >= maxTags) return;
    
    onTagsChange([...selectedTags, tag]);
    setSearchTerm('');
  }, [selectedTags, onTagsChange, maxTags]);

  const handleTagRemove = useCallback((tagToRemove: TagInfo) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
  }, [selectedTags, onTagsChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  }, []);

  const handleCreateTag = useCallback(async () => {
    if (!onCreateTag || !newTagName.trim()) return;

    setCreating(true);
    try {
      const newTag = await onCreateTag(newTagName.trim(), newTagColor);
      handleTagSelect(newTag);
      setNewTagName('');
      setShowCreateForm(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setCreating(false);
    }
  }, [onCreateTag, newTagName, newTagColor, handleTagSelect]);

  const handleQuickCreate = useCallback(() => {
    if (canCreateNew) {
      setNewTagName(searchTerm);
      setShowCreateForm(true);
    }
  }, [canCreateNew, searchTerm]);

  const clearAllTags = useCallback(() => {
    onTagsChange([]);
  }, [onTagsChange]);

  return (
    <div ref={containerRef} className={`${styles.selectorContainer} ${className || ''}`}>
      {/* 已选标签显示 */}
      <div className={styles.selectedTags}>
        {selectedTags.map(tag => (
          <span 
            key={tag.id} 
            className={styles.selectedTag}
            style={{ '--tag-color': tag.color } as React.CSSProperties}
          >
            {tag.name}
            <button
              className={styles.removeTagButton}
              onClick={() => handleTagRemove(tag)}
              title={`移除标签 ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {selectedTags.length === 0 && (
          <span style={{ color: 'var(--yunke-text-tertiary-color)', fontSize: '14px' }}>
            点击输入框搜索或添加标签
          </span>
        )}
      </div>

      {/* 搜索输入框 */}
      <input
        ref={searchInputRef}
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={() => setIsOpen(true)}
        disabled={selectedTags.length >= maxTags}
      />

      {/* 下拉选项 */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownContent}>
            {/* 创建新标签表单 */}
            {showCreateForm && (
              <div className={styles.tagCreateForm}>
                <input
                  type="text"
                  className={styles.tagNameInput}
                  placeholder="标签名称"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  maxLength={20}
                />
                <div className={styles.colorPicker}>
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      className={styles.colorOption}
                      style={{ backgroundColor: color }}
                      data-selected={newTagColor === color}
                      onClick={() => setNewTagColor(color)}
                      title={`选择颜色 ${color}`}
                    />
                  ))}
                  <input
                    type="color"
                    className={styles.customColorInput}
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    title="自定义颜色"
                  />
                </div>
                <div className={styles.formActions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCreateForm(false)}
                  >
                    取消
                  </button>
                  <button 
                    className={styles.submitButton}
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || creating}
                  >
                    {creating ? '创建中...' : '创建标签'}
                  </button>
                </div>
              </div>
            )}

            {/* 快速创建按钮 */}
            {canCreateNew && !showCreateForm && (
              <div className={styles.createTagSection}>
                <button className={styles.createTagButton} onClick={handleQuickCreate}>
                  + 创建标签 "{searchTerm}"
                </button>
              </div>
            )}

            {/* 标签列表 */}
            <div className={styles.tagsList}>
              {filteredTags.length > 0 ? (
                filteredTags.slice(0, 10).map(tag => (
                  <div
                    key={tag.id}
                    className={styles.tagOption}
                    onClick={() => handleTagSelect(tag)}
                  >
                    <input
                      type="checkbox"
                      className={styles.tagCheckbox}
                      checked={false}
                      readOnly
                    />
                    <span 
                      className={styles.tagPreview}
                      style={{ '--tag-color': tag.color } as React.CSSProperties}
                    >
                      {tag.name}
                    </span>
                    <div className={styles.tagInfo}>
                      <div className={styles.tagName}>{tag.name}</div>
                      <div className={styles.tagUsage}>使用次数: {tag.usageCount}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  {searchTerm ? '没有找到匹配的标签' : '暂无可用标签'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 操作栏 */}
      <div className={styles.actions}>
        <span className={styles.tagCount}>
          已选择 {selectedTags.length}/{maxTags} 个标签
        </span>
        {selectedTags.length > 0 && (
          <button className={styles.clearButton} onClick={clearAllTags}>
            清除所有
          </button>
        )}
      </div>
    </div>
  );
};

export default TagSelector;