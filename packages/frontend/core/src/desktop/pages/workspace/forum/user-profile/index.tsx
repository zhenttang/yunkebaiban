import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getUserPoints, signIn } from '../forum-api';
import type { UserPointDTO } from '../types';

export function Component() {
  const { userId } = useParams<{ userId: string }>();
  const [userPoints, setUserPoints] = useState<UserPointDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    getUserPoints(parseInt(userId))
      .then(setUserPoints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSignIn = async () => {
    if (!userId || signingIn) return;
    setSigningIn(true);
    try {
      const updated = await signIn(parseInt(userId));
      setUserPoints(updated);
      alert('签到成功');
    } catch (error: any) {
      console.error(error);
      alert(error?.message || '签到失败');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!userPoints) return <div>用户不存在</div>;

  const computedLevel = useMemo(() => {
    // 依据总积分计算等级（简单规则：每100分升1级，最低为1级）
    const base = Math.floor((userPoints.totalPoints ?? 0) / 100) + 1;
    return userPoints.level && userPoints.level > 0 ? userPoints.level : base;
  }, [userPoints.totalPoints, userPoints.level]);

  const levelProgress = ((userPoints.totalPoints % 100) / 100) * 100;
  const canSignIn =
    !userPoints.lastSignInDate ||
    new Date(userPoints.lastSignInDate).toDateString() !== new Date().toDateString();

  const currentUserId = Number(globalThis.localStorage?.getItem('affine-user-id') || '0');
  const isCurrentUser = currentUserId ? currentUserId === userPoints.userId : true;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div
        style={{
          padding: 30,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>{userPoints.username || `用户${userPoints.userId}`}</h1>
        <div style={{ marginTop: 20, display: 'flex', gap: 40 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{userPoints.totalPoints}</div>
            <div style={{ opacity: 0.9 }}>总积分</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>Lv.{computedLevel}</div>
            <div style={{ opacity: 0.9 }}>等级</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{userPoints.continuousSignInDays}</div>
            <div style={{ opacity: 0.9 }}>连续签到</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
          上次签到：{userPoints.lastSignInDate ? new Date(userPoints.lastSignInDate).toLocaleString() : '从未签到'}
        </div>
        
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 5 }}>
            距离下一级还需 {100 - (userPoints.totalPoints % 100)} 积分
          </div>
          <div
            style={{ height: 8, background: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${levelProgress}%`,
                background: '#fff',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      </div>

      {isCurrentUser && (
        <div style={{ marginTop: 30, display: 'flex', gap: 20 }}>
          <button
            onClick={handleSignIn}
            disabled={!canSignIn || signingIn}
            style={{
              flex: 1,
              padding: '15px 30px',
              fontSize: 16,
              background: canSignIn ? '#52c41a' : '#d9d9d9',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: canSignIn ? 'pointer' : 'not-allowed',
            }}
          >
            {signingIn ? '签到中...' : canSignIn ? '每日签到' : '今日已签到'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h2>统计数据</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{userPoints.postCount}</div>
            <div style={{ marginTop: 5, color: '#999' }}>发帖数</div>
          </div>
          <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{userPoints.replyCount}</div>
            <div style={{ marginTop: 5, color: '#999' }}>回复数</div>
          </div>
          <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{userPoints.reputation}</div>
            <div style={{ marginTop: 5, color: '#999' }}>声望</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>用户发帖</h2>
        <div style={{ color: '#999' }}>功能开发中</div>
      </div>
    </div>
  );
}
