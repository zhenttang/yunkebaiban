import { useState, useEffect, useCallback } from 'react';
import type { CommunityDoc, GetCommunityDocsParams } from '../types';

interface UseCommunityDocsOptions extends GetCommunityDocsParams {
  workspaceId: string;
}

// 模拟的社区API调用 - 在实际实现时会被真实的API调用替换
const mockCommunityApi = {
  getCommunityDocs: async (workspaceId: string, params: GetCommunityDocsParams = {}) => {
    console.log('🔗 模拟API调用 getCommunityDocs:', { workspaceId, params });
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    const mockDocs: CommunityDoc[] = [
      {
        id: '1',
        title: '项目开发指南',
        description: '详细介绍了项目的开发流程和规范',
        authorId: 'user1',
        authorName: '张三',
        sharedAt: new Date().toISOString(),
        viewCount: 25,
        permission: 'PUBLIC' as const,
        workspaceId,
      },
      {
        id: '2',
        title: '技术架构文档',
        description: '系统的整体架构设计和技术选型说明',
        authorId: 'user2',
        authorName: '李四',
        sharedAt: new Date(Date.now() - 86400000).toISOString(),
        viewCount: 15,
        permission: 'COLLABORATOR' as const,
        workspaceId,
      },
    ];

    // 模拟搜索过滤
    let filteredDocs = mockDocs;
    if (params.search) {
      filteredDocs = mockDocs.filter(doc => 
        doc.title.includes(params.search!) || 
        doc.description.includes(params.search!)
      );
    }

    const result = {
      success: true,
      docs: filteredDocs,
      page: params.page || 0,
      size: params.size || 20,
      total: filteredDocs.length,
      totalPages: Math.ceil(filteredDocs.length / (params.size || 20)),
    };
    
    console.log('✅ 模拟API返回:', result);
    return result;
  }
};

export const useCommunityDocs = (options: UseCommunityDocsOptions) => {
  const [docs, setDocs] = useState<CommunityDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎣 useCommunityDocs Hook 初始化:', options);

  const loadDocs = useCallback(async (reset = false) => {
    if (loading) {
      console.log('⏳ 已在加载中，跳过重复请求');
      return;
    }
    
    console.log('🔄 开始加载文档:', { reset, options });
    setLoading(true);
    setError(null);
    
    try {
      const response = await mockCommunityApi.getCommunityDocs(options.workspaceId, {
        page: reset ? 0 : options.page,
        size: options.size,
        search: options.search
      });
      
      if (response.success) {
        console.log('✅ 文档加载成功:', response.docs);
        setDocs(prev => reset ? response.docs : [...prev, ...response.docs]);
        setHasMore(response.docs.length === (options.size || 20));
      } else {
        console.error('❌ 文档加载失败');
        setError('获取社区文档失败');
      }
    } catch (err) {
      console.error('❌ 网络错误:', err);
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
      console.log('✅ 文档加载完成');
    }
  }, [options.workspaceId, options.page, options.search, options.size, loading]);

  useEffect(() => {
    console.log('🎯 Effect: 重新加载文档 (workspaceId 或 search 变化)');
    loadDocs(true);
  }, [options.workspaceId, options.search]);

  const loadMore = useCallback(() => {
    console.log('📄 加载更多文档:', { hasMore, loading });
    if (hasMore && !loading) {
      loadDocs(false);
    }
  }, [hasMore, loading, loadDocs]);

  console.log('🎣 useCommunityDocs Hook 返回:', { 
    docsCount: docs.length, 
    loading, 
    error, 
    hasMore 
  });

  return {
    docs,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => loadDocs(true)
  };
};