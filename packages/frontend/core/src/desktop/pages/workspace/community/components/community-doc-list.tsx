import { SearchIcon } from '@blocksuite/icons/rc';
import { useState, useEffect } from 'react';

import { CommunityDocCard } from './community-doc-card';
import { useCommunityDocs } from '../hooks/use-community';
import * as styles from '../community.css';

interface CommunityDocListProps {
  workspaceId: string;
}

export const CommunityDocList = ({ workspaceId }: CommunityDocListProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  
  const { docs, loading, hasMore, loadMore } = useCommunityDocs({
    workspaceId,
    search,
    page,
    size: 20
  });

  useEffect(() => {
    console.log('📋 社区文档列表组件已加载, workspaceId:', workspaceId);
    console.log('📋 文档数据:', { docs, loading, hasMore });
  }, [workspaceId, docs, loading, hasMore]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  if (loading && docs.length === 0) {
    console.log('⏳ 正在加载社区文档...');
    return <div>加载中...</div>;
  }

  console.log('📋 渲染社区文档列表, docs.length:', docs.length);

  return (
    <div className={styles.docListContainer}>
      <div className={styles.searchSection}>
        <div style={{ position: 'relative' }}>
          <SearchIcon style={{ 
            position: 'absolute', 
            left: '8px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: 'var(--affine-text-placeholder-color)'
          }} />
          <input
            type="text"
            placeholder="搜索社区文档..."
            value={search}
            onChange={handleSearch}
            style={{
              width: '100%',
              paddingLeft: '32px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              border: '1px solid var(--affine-border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--affine-background-primary-color)',
              color: 'var(--affine-text-primary-color)',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      <div className={styles.docGrid}>
        {docs.map(doc => (
          <CommunityDocCard key={doc.id} doc={doc} />
        ))}
      </div>
      
      {docs.length === 0 && (
        <div className={styles.emptyState}>
          <p>暂无社区文档</p>
        </div>
      )}
      
      {hasMore && (
        <div className={styles.loadMoreSection}>
          <button 
            onClick={loadMore} 
            disabled={loading}
            className={styles.loadMoreButton}
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
};