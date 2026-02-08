import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPost, saveDraft, getDraft, publishDraft, uploadAttachment } from '../forum-api';
import { useToast } from '../hooks/useToast';
import { notify } from '@yunke/component';

export function Component() {
  const { showError, showSuccess, ToastContainer } = useToast();
  const { forumId } = useParams<{ forumId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const allowedExt = useMemo(
    () => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'txt'],
    []
  );

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const next: File[] = [];
    const errors: string[] = [];
    Array.from(list).forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExt.includes(ext)) {
        errors.push(`${f.name} 类型不支持`);
        return;
      }
      if (f.size > MAX_SIZE) {
        errors.push(`${f.name} 大小超出 50MB 限制`);
        return;
      }
      next.push(f);
    });
    if (errors.length) notify.warning({ title: errors.join('\n') });
    setFiles(prev => [...prev, ...next]);
    // 允许选择相同文件
    e.currentTarget.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const draftIdFromUrl = useMemo(() => {
    const search = new URLSearchParams(location.search);
    return search.get('draftId');
  }, [location.search]);

  // 加载草稿内容
  useEffect(() => {
    if (!draftIdFromUrl) return;
    (async () => {
      try {
        const draft = await getDraft(draftIdFromUrl);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setTags(draft.tags || '');
        setCurrentDraftId(draft.id);
        setHasChanges(false);
      } catch (err) {
        console.error(err);
        showError('加载草稿失败');
      }
    })();
  }, [draftIdFromUrl]);

  // 自动保存草稿（每30秒）
  useEffect(() => {
    const timer = setInterval(() => {
      if (!forumId) return;
      if (!title.trim() && !content.trim()) return; // 没有内容不保存
      if (!hasChanges) return;
      handleSaveDraft(true).catch(console.error);
    }, 30000);
    return () => clearInterval(timer);
  }, [forumId, title, content, tags, hasChanges, currentDraftId]);

  const handleSaveDraft = async (isAuto = false) => {
    if (!forumId) {
      notify.warning({ title: '缺少板块ID' });
      return;
    }
    if (!title.trim() && !content.trim()) {
      if (!isAuto) notify.warning({ title: '请输入标题或内容后再保存草稿' });
      return;
    }

    setSaving(true);
    try {
      const draft = await saveDraft({
        id: currentDraftId || undefined,
        forumId: parseInt(forumId, 10),
        title,
        content,
        tags: tags || undefined,
      });

      setCurrentDraftId(draft.id);
      setHasChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());

      // 如果URL中没有draftId，则追加，便于刷新/继续编辑
      if (!draftIdFromUrl) {
        const search = new URLSearchParams(location.search);
        search.set('draftId', draft.id);
        navigate({ pathname: location.pathname, search: `?${search.toString()}` }, { replace: true });
      }

      if (!isAuto) {
        showSuccess('草稿已保存');
      }
    } catch (error) {
      console.error(error);
      if (!isAuto) showError('保存草稿失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!forumId || !title.trim() || !content.trim()) {
      notify.warning({ title: '请填写标题和内容' });
      return;
    }

    setSubmitting(true);
    try {
      let post;
      if (currentDraftId) {
        // 发布草稿
        post = await publishDraft(currentDraftId);
      } else {
        // 直接发帖
        post = await createPost({
          forumId: parseInt(forumId, 10),
          title,
          content,
          tags: tags || undefined,
        });
      }
      // 上传附件
      if (files.length) {
        try {
          await Promise.all(files.map(f => uploadAttachment(post.id, f)));
        } catch (e) {
          console.error(e);
          // 附件部分失败，提示用户
          showError('部分附件上传失败');
        }
      }

      navigate(`/forum/${forumId}/post/${post.id}`);
    } catch (error) {
      console.error(error);
      showError('发帖失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>发表新帖</h1>

      <div style={{ marginTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          标题
        </label>
        <input
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setHasChanges(true);
          }}
          placeholder="输入帖子标题..."
          style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid #ddd', borderRadius: 4 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          附件（可选）
        </label>
        <input
          type="file"
          multiple
          onChange={onFilesChange}
          accept={
            '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt'
          }
        />
        {files.length > 0 && (
          <div style={{ marginTop: 10, border: '1px solid #eee', borderRadius: 4 }}>
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: i === files.length - 1 ? 'none' : '1px solid #f5f5f5',
                }}
              >
                <div>
                  <div style={{ fontSize: 14 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{formatSize(f.size)}</div>
                </div>
                <button onClick={() => removeFile(i)} style={{ fontSize: 12 }}>删除</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          最大 50MB；支持：jpg, png, gif, pdf, doc, zip 等
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          内容
        </label>
        <textarea
          value={content}
          onChange={e => {
            setContent(e.target.value);
            setHasChanges(true);
          }}
          placeholder="输入帖子内容..."
          style={{
            width: '100%',
            minHeight: 300,
            padding: 12,
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          标签（可选）
        </label>
        <input
          type="text"
          value={tags}
          onChange={e => {
            setTags(e.target.value);
            setHasChanges(true);
          }}
          placeholder="多个标签用逗号分隔..."
          style={{ width: '100%', padding: 12, fontSize: 14, border: '1px solid #ddd', borderRadius: 4 }}
        />
      </div>

      <div style={{ marginTop: 30, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '12px 30px',
            fontSize: 16,
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '发布中...' : '发布'}
        </button>
        <button
          onClick={() => handleSaveDraft(false)}
          disabled={saving}
          style={{
            padding: '12px 30px',
            fontSize: 16,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '保存中...' : currentDraftId ? '保存草稿' : '保存草稿'}
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 30px',
            fontSize: 16,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        {lastSavedAt && (
          <span style={{ color: '#999', fontSize: 12 }}>已于 {lastSavedAt} 自动保存</span>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
