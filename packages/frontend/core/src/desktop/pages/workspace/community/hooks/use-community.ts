import { useState, useEffect, useCallback } from 'react';
import type { CommunityDoc, GetCommunityDocsParams } from '../types';

interface UseCommunityDocsOptions extends GetCommunityDocsParams {
  workspaceId: string;
}

// 模拟的社区文档数据
const mockDocsData: CommunityDoc[] = [
  {
    id: '1',
    title: '项目开发指南',
    description: '详细介绍了项目的开发流程和规范，包含环境搭建、代码规范、测试流程等重要内容。',
    authorId: 'user1',
    authorName: '张三',
    sharedAt: new Date().toISOString(),
    viewCount: 25,
    permission: 'PUBLIC' as const,
    workspaceId: '',
  },
  {
    id: '2',
    title: '技术架构文档',
    description: '系统的整体架构设计和技术选型说明，涵盖前端、后端、数据库等各个层面。',
    authorId: 'user2',
    authorName: '李四',
    sharedAt: new Date(Date.now() - 86400000).toISOString(),
    viewCount: 15,
    permission: 'COLLABORATOR' as const,
    workspaceId: '',
  },
  {
    id: '3',
    title: 'API接口文档',
    description: '完整的API接口说明文档，包含所有接口的请求参数、响应格式和示例。',
    authorId: 'user1',
    authorName: '张三',
    sharedAt: new Date(Date.now() - 172800000).toISOString(),
    viewCount: 42,
    permission: 'PUBLIC' as const,
    workspaceId: '',
  },
  {
    id: '4',
    title: '系统管理员手册',
    description: '系统管理员专用文档，包含服务器配置、数据备份、安全设置等敏感信息。',
    authorId: 'admin1',
    authorName: '王管理员',
    sharedAt: new Date(Date.now() - 259200000).toISOString(),
    viewCount: 8,
    permission: 'ADMIN' as const,
    workspaceId: '',
  },
  {
    id: '5',
    title: '团队协作规范',
    description: '团队内部协作流程和规范，包含会议制度、代码审查、项目管理等内容。',
    authorId: 'user3',
    authorName: '赵五',
    sharedAt: new Date(Date.now() - 345600000).toISOString(),
    viewCount: 33,
    permission: 'COLLABORATOR' as const,
    workspaceId: '',
  },
];

// 模拟的社区API调用 - 在实际实现时会被真实的API调用替换
const mockCommunityApi = {
  getCommunityDocs: async (workspaceId: string, params: GetCommunityDocsParams = {}) => {
    console.log('🔗 模拟API调用 getCommunityDocs:', { workspaceId, params });
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 为模拟数据设置正确的workspaceId
    const mockDocs = mockDocsData.map(doc => ({ ...doc, workspaceId }));

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
  },

  getCommunityDocDetail: async (workspaceId: string, docId: string): Promise<{ success: boolean; doc: CommunityDoc | null }> => {
    console.log('🔗 模拟API调用 getCommunityDocDetail:', { workspaceId, docId });
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 查找对应的文档
    const doc = mockDocsData.find(d => d.id === docId);
    
    if (!doc) {
      console.log('❌ 文档未找到:', docId);
      return { success: false, doc: null };
    }

    // 模拟浏览次数增加
    const updatedDoc = { ...doc, workspaceId, viewCount: doc.viewCount + 1 };
    
    const result = { success: true, doc: updatedDoc };
    console.log('✅ 模拟详情API返回:', result);
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

/**
 * 社区文档详情Hook
 * 用于获取单个文档的详情信息
 */
export const useCommunityDocDetail = (workspaceId: string, docId: string) => {
  const [doc, setDoc] = useState<CommunityDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🎣 useCommunityDocDetail Hook 初始化:', { workspaceId, docId });

  const loadDocDetail = useCallback(async () => {
    if (!workspaceId || !docId) {
      console.log('⚠️ 缺少必要参数，跳过加载');
      return;
    }

    if (loading) {
      console.log('⏳ 已在加载中，跳过重复请求');
      return;
    }

    console.log('🔄 开始加载文档详情:', { workspaceId, docId });
    setLoading(true);
    setError(null);

    try {
      const response = await mockCommunityApi.getCommunityDocDetail(workspaceId, docId);
      
      if (response.success && response.doc) {
        console.log('✅ 文档详情加载成功:', response.doc);
        setDoc(response.doc);
      } else {
        console.error('❌ 文档不存在');
        setError('文档不存在或已被删除');
      }
    } catch (err) {
      console.error('❌ 加载文档详情失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      console.log('✅ 文档详情加载完成');
    }
  }, [workspaceId, docId, loading]);

  useEffect(() => {
    console.log('🎯 Effect: 加载文档详情');
    loadDocDetail();
  }, [loadDocDetail]);

  console.log('🎣 useCommunityDocDetail Hook 返回:', { 
    doc: doc ? { id: doc.id, title: doc.title } : null, 
    loading, 
    error 
  });

  return {
    doc,
    loading,
    error,
    refresh: loadDocDetail
  };
};