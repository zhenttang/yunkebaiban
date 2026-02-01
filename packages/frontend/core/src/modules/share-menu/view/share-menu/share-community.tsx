import { Button } from '@yunke/component/ui/button';
import { DocService } from '@yunke/core/modules/doc';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import * as styles from './share-community.css';

// API functions (from community api)
const API_BASE = '/api/community';

async function getCommunityDocStatus(workspaceId: string, docId: string) {
  const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/docs/${docId}/status`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw error;
  }
  return response.json();
}

async function shareDocToCommunity(
  workspaceId: string,
  docId: string,
  title: string,
  description: string,
  tags: string[]
) {
  const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/docs/${docId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, tags }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw error;
  }
  return response.json();
}

async function unshareDocFromCommunity(workspaceId: string, docId: string) {
  const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/docs/${docId}/unshare`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw error;
  }
  return response.json();
}

export const ShareCommunity = () => {
  const t = useI18n();
  const docService = useService(DocService);
  const workspaceService = useService(WorkspaceService);
  
  const docId = docService.doc.id;
  const workspaceId = workspaceService.workspace.id;
  const docTitle = useLiveData(docService.doc.title$) || 'Untitled';

  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Check share status
  useEffect(() => {
    let cancelled = false;
    
    const fetchStatus = async () => {
      try {
        setChecking(true);
        const response = await getCommunityDocStatus(workspaceId, docId);
        if (cancelled) return;
        setIsShared(!!response?.data);
      } catch (error) {
        if (cancelled) return;
        const errorCode = (error as any)?.code;
        const isPermissionError = 
          errorCode === 'COMMUNITY_DOC_ACCESS_DENIED' ||
          errorCode === 'DOC_NOT_SHARED_TO_COMMUNITY' ||
          errorCode === 'FORBIDDEN';
        if (!isPermissionError) {
          console.warn('获取社区分享状态失败', error);
        }
        setIsShared(false);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    void fetchStatus();
    return () => { cancelled = true; };
  }, [docId, workspaceId]);

  // Initialize form with doc title
  useEffect(() => {
    setTitle(docTitle);
  }, [docTitle]);

  const handleShare = useCallback(async () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }

    setLoading(true);
    try {
      const tagList = tags
        .split(/[,，]/)
        .map(t => t.trim())
        .filter(Boolean);
      
      await shareDocToCommunity(workspaceId, docId, title, description, tagList);
      setIsShared(true);
      setShowForm(false);
    } catch (error) {
      console.error('分享失败:', error);
      alert(error instanceof Error ? error.message : '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, docId, title, description, tags]);

  const handleUnshare = useCallback(async () => {
    if (!confirm('确定要取消分享到社区吗？')) {
      return;
    }

    setLoading(true);
    try {
      await unshareDocFromCommunity(workspaceId, docId);
      setIsShared(false);
    } catch (error) {
      console.error('取消分享失败:', error);
      alert(error instanceof Error ? error.message : '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, docId]);

  if (checking) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingText}>检查分享状态...</div>
      </div>
    );
  }

  if (isShared) {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.statusIcon}>✓</div>
          <div className={styles.statusText}>
            <div className={styles.statusTitle}>已分享到社区</div>
            <div className={styles.statusDesc}>其他工作空间成员可以在社区中看到此文档</div>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleUnshare}
          disabled={loading}
          className={styles.unshareButton}
        >
          {loading ? '处理中...' : '取消分享'}
        </Button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className={styles.container}>
        <div className={styles.formTitle}>分享到社区</div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="输入标题"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            placeholder="简要描述文档内容..."
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>标签</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={styles.input}
            placeholder="用逗号分隔，如：教程,笔记,技术"
          />
        </div>

        <div className={styles.buttonGroup}>
          <Button
            variant="secondary"
            onClick={() => setShowForm(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={loading}
          >
            {loading ? '分享中...' : '确认分享'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>分享到工作空间社区</div>
        <div className={styles.infoDesc}>
          将文档分享到社区后，工作空间内的其他成员可以浏览和学习你的内容
        </div>
      </div>
      <Button
        variant="primary"
        onClick={() => setShowForm(true)}
        className={styles.shareButton}
      >
        分享到社区
      </Button>
    </div>
  );
};
