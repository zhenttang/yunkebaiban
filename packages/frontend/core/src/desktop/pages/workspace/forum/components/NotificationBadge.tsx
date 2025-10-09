import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadCount, getNotifications, markAsRead } from '../forum-api';
import type { NotificationDTO } from '../types';

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Load unread count initially and poll every 30s
  useEffect(() => {
    const loadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (e) {
        console.error(e);
      }
    };

    loadCount();
    intervalRef.current = window.setInterval(loadCount, 30000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const loadLatestNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications(0, 5);
      setNotifications(res?.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      loadLatestNotifications();
    }
  };

  const handleItemClick = async (n: NotificationDTO) => {
    try {
      if (!n.isRead) {
        await markAsRead(n.id);
        // Optimistically update local state
        setNotifications(prev => prev.map(x => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadCount(c => (c > 0 ? c - 1 : 0));
      }
    } catch (e) {
      console.error(e);
    }

    setIsOpen(false);
    const forumId = n.forumId;
    const postId = n.postId;
    const replyId = n.replyId;
    if (forumId && postId) {
      navigate(
        replyId
          ? `/forum/${forumId}/post/${postId}#reply-${replyId}`
          : `/forum/${forumId}/post/${postId}`
      );
    }
  };

  const truncate = (text?: string, len = 50) => {
    if (!text) return '';
    return text.length > len ? text.slice(0, len) + '…' : text;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggleOpen}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: 18,
          border: '1px solid #ddd',
          background: '#fff',
          cursor: 'pointer',
        }}
        aria-label="notifications"
        title="通知"
      >
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              background: '#f5222d',
              color: '#fff',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              lineHeight: '18px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 8,
            width: 320,
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 6,
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: 10, borderBottom: '1px solid #f5f5f5', fontWeight: 600 }}>最新通知</div>
          {loading ? (
            <div style={{ padding: 12, color: '#999' }}>加载中...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 12, color: '#999' }}>暂无通知</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  padding: 10,
                  borderBottom: '1px solid #f5f5f5',
                  background: n.isRead ? '#fff' : '#fffbe6',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#fff',
                      background:
                        n.type === 'ForumMention'
                          ? '#13c2c2'
                          : n.type === 'ForumPostReplied'
                          ? '#1890ff'
                          : n.type === 'ForumReplyLiked' || n.type === 'ForumPostLiked'
                          ? '#faad14'
                          : '#f5222d',
                      padding: '1px 5px',
                      borderRadius: 3,
                    }}
                  >
                    {n.type === 'ForumMention'
                      ? '@提及'
                      : n.type === 'ForumPostReplied'
                      ? '回复'
                      : n.type === 'ForumReplyLiked' || n.type === 'ForumPostLiked'
                      ? '点赞'
                      : '版主操作'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {n.actorName ? `${n.actorName}：` : ''}
                    {truncate(n.excerpt || n.title || '新的通知')}
                  </span>
                </div>
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
          <div style={{ padding: 10, textAlign: 'center' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/forum/notifications');
              }}
              style={{
                padding: '6px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              查看全部
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
