/**
 * 统一的认证组件
 */

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from './hooks';

/**
 * 认证守卫组件Props
 */
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * 认证守卫组件
 * 用于保护需要认证的页面和组件
 */
export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = true,
  redirectTo 
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated && redirectTo) {
      // 如果指定了重定向路径，则重定向到登录页面
      window.location.href = redirectTo;
    }
  }, [loading, requireAuth, isAuthenticated, redirectTo]);

  // 加载中状态
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner">加载中...</div>
      </div>
    );
  }

  // 需要认证但未认证
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="auth-required">
        {fallback || (
          <div className="auth-message">
            <h3>需要登录</h3>
            <p>请先登录后再访问此页面</p>
          </div>
        )}
      </div>
    );
  }

  // 不需要认证或已认证
  return <>{children}</>;
}

/**
 * 用户信息组件Props
 */
interface UserInfoProps {
  showAvatar?: boolean;
  showEmail?: boolean;
  avatarSize?: number;
  className?: string;
}

/**
 * 用户信息显示组件
 */
export function UserInfo({ 
  showAvatar = true, 
  showEmail = true, 
  avatarSize = 40,
  className = ''
}: UserInfoProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={`user-info ${className}`}>
      {showAvatar && (
        <div className="user-avatar">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              width={avatarSize}
              height={avatarSize}
              style={{ borderRadius: '50%' }}
            />
          ) : (
            <div 
              className="avatar-placeholder"
              style={{ 
                width: avatarSize, 
                height: avatarSize,
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: avatarSize / 2
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
      <div className="user-details">
        <div className="user-name">{user.name}</div>
        {showEmail && (
          <div className="user-email">{user.email}</div>
        )}
      </div>
    </div>
  );
}

/**
 * 登录按钮组件Props
 */
interface LoginButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
}

/**
 * 登录按钮组件
 */
export function LoginButton({ 
  className = '', 
  style, 
  children, 
  onClick 
}: LoginButtonProps) {
  const { isAuthenticated, loading } = useAuth();

  if (isAuthenticated) {
    return null;
  }

  return (
    <button 
      className={`login-button ${className}`}
      style={style}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? '登录中...' : (children || '登录')}
    </button>
  );
}

/**
 * 注销按钮组件Props
 */
interface LogoutButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  onLogout?: () => void;
}

/**
 * 注销按钮组件
 */
export function LogoutButton({ 
  className = '', 
  style, 
  children,
  onLogout
}: LogoutButtonProps) {
  const { isAuthenticated, loading, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button 
      className={`logout-button ${className}`}
      style={style}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? '注销中...' : (children || '注销')}
    </button>
  );
}

/**
 * 认证状态指示器组件Props
 */
interface AuthStatusProps {
  showIcon?: boolean;
  className?: string;
}

/**
 * 认证状态指示器组件
 */
export function AuthStatus({ showIcon = true, className = '' }: AuthStatusProps) {
  const { isAuthenticated, loading, error } = useAuth();

  if (loading) {
    return (
      <div className={`auth-status loading ${className}`}>
        {showIcon && <span className="icon">⏳</span>}
        <span className="text">认证中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`auth-status error ${className}`}>
        {showIcon && <span className="icon">❌</span>}
        <span className="text">认证错误: {error}</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={`auth-status authenticated ${className}`}>
        {showIcon && <span className="icon">✅</span>}
        <span className="text">已认证</span>
      </div>
    );
  }

  return (
    <div className={`auth-status unauthenticated ${className}`}>
      {showIcon && <span className="icon">🔒</span>}
      <span className="text">未认证</span>
    </div>
  );
}

/**
 * 认证表单组件Props
 */
interface AuthFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
  showRegisterLink?: boolean;
  showForgotPassword?: boolean;
}

/**
 * 简单的认证表单组件
 */
export function AuthForm({ 
  onSuccess, 
  onError,
  className = '',
  showRegisterLink = true,
  showForgotPassword = true
}: AuthFormProps) {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const success = await login({
        email,
        password,
        type: 'password'
      });
      
      if (success) {
        onSuccess?.(null);
      } else {
        onError?.(error || '登录失败');
      }
    } catch (err: any) {
      onError?.(err.message || '登录失败');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`auth-form ${className}`}>
      <div className="form-group">
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="请输入您的邮箱"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="请输入密码"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="submit-button"
      >
        {loading ? '登录中...' : '登录'}
      </button>

      {showForgotPassword && (
        <div className="forgot-password">
          <a href="/forgot-password">忘记密码？</a>
        </div>
      )}

      {showRegisterLink && (
        <div className="register-link">
          没有账号？<a href="/register">立即注册</a>
        </div>
      )}
    </form>
  );
}