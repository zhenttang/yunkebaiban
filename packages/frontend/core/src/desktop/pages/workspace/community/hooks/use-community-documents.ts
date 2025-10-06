import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommunityDocument, PaginatedResponse } from '../types';
import { getPublicDocuments, searchDocuments } from '../api';

interface UseCommunityDocumentsOptions {
  page: number;
  size: number;
  search?: string;
}

interface CommunityDocumentsState {
  docs: CommunityDocument[];
  total: number;
  totalPages: number;
  page: number;
}

export const useCommunityDocuments = ({
  page,
  size,
  search,
}: UseCommunityDocumentsOptions) => {
  const [state, setState] = useState<CommunityDocumentsState>({
    docs: [],
    total: 0,
    totalPages: 0,
    page,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDocs = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      let response: PaginatedResponse<CommunityDocument>;

      if (search && search.trim().length > 0) {
        response = await searchDocuments({
          keyword: search.trim(),
          page,
          size,
        });
      } else {
        response = await getPublicDocuments({
          page,
          size,
        });
      }

      if (!mountedRef.current) {
        return;
      }

      setState({
        docs: response.content ?? [],
        total: response.totalElements ?? (response.content?.length ?? 0),
        totalPages: response.totalPages ?? 0,
        page: response.number ?? page,
      });
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      console.error('加载社区文档失败', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setState(prev => ({ ...prev, docs: [] }));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, size, search]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  return {
    ...state,
    loading,
    error,
    refresh: fetchDocs,
  };
};
