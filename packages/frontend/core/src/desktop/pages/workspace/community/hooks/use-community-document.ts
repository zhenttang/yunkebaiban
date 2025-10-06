import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommunityDocument } from '../types';
import { getDocument } from '../api';

interface UseCommunityDocumentOptions {
  docId?: string;
}

export const useCommunityDocument = ({ docId }: UseCommunityDocumentOptions) => {
  const [doc, setDoc] = useState<CommunityDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDoc = useCallback(async () => {
    if (!docId) {
      if (mountedRef.current) {
        setDoc(null);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const document = await getDocument(docId);
      if (!mountedRef.current) {
        return;
      }
      setDoc(document);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      console.error('加载社区文档详情失败', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setDoc(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [docId]);

  useEffect(() => {
    void fetchDoc();
  }, [fetchDoc]);

  return {
    doc,
    loading,
    error,
    refresh: fetchDoc,
  };
};
