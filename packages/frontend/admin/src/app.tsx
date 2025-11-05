import { Toaster } from '@yunke/admin/components/ui/sonner';
import { lazy, ROUTES } from '@yunke/routes';
import { withSentryReactRouterV7Routing } from '@sentry/react';
import { useEffect, Component, ErrorInfo, ReactNode, Suspense, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes as ReactRouterRoutes,
  useLocation,
} from 'react-router-dom';
import { toast } from 'sonner';
import { SWRConfig } from 'swr';

import { TooltipProvider } from './components/ui/tooltip';
import { useCurrentUser, useServerConfig, useRevalidateCurrentUser, useAdminAccess } from './modules/common';
import { Layout } from './modules/layout';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">出现错误</h2>
          <p className="text-gray-600 mb-4">页面加载失败，请刷新页面重试</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const Setup = lazy(
  () => import(/* webpackChunkName: "setup" */ './modules/setup')
);
export const Accounts = lazy(
  () => import(/* webpackChunkName: "accounts" */ './modules/accounts')
);
export const AI = lazy(
  () => import(/* webpackChunkName: "ai" */ './modules/ai')
);
export const About = lazy(
  () => import(/* webpackChunkName: "about" */ './modules/about')
);
export const Settings = lazy(
  () => import(/* webpackChunkName: "settings" */ './modules/settings')
);
export const Auth = lazy(
  () => import(/* webpackChunkName: "auth" */ './modules/auth')
);
export const Monitoring = lazy(
  () => import(/* webpackChunkName: "monitoring" */ './modules/monitoring')
);

const Routes = window.SENTRY_RELEASE
  ? withSentryReactRouterV7Routing(ReactRouterRoutes)
  : ReactRouterRoutes;

function AuthenticatedRoutes() {
  const user = useCurrentUser();
  const [retryCount, setRetryCount] = useState(0);
  const revalidateUser = useRevalidateCurrentUser();
  const location = useLocation();

  const { checking, allowed } = useAdminAccess();
  console.log('AuthenticatedRoutes:', user === undefined ? '加载中' : user === null ? '未登录' : `已登录: ${user.email}`);
  console.log('当前路径:', location.pathname);

  useEffect(() => {
    if (allowed === false) {
      console.log('无管理员权限或获取失败');
      toast.error('您没有管理员权限，请使用管理员账户登录。');
    }
  }, [allowed]);

  // 如果用户数据还在加载中，显示加载状态
  if (user === undefined || checking) {
    console.log('显示LoadingSpinner');
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner />
        <div className="mt-4 text-center">
          <p className="text-gray-600 mb-2">正在加载用户信息...</p>
          {retryCount > 0 && (
            <button 
              onClick={() => {
                setRetryCount(c => c + 1);
                revalidateUser();
              }}
              className="text-blue-500 hover:text-blue-700 underline text-sm"
            >
              网络较慢？点击重试
            </button>
          )}
        </div>
      </div>
    );
  }

  // 如果用户未登录或不是管理员，重定向到登录页
  if (!user) {
    console.log('重定向到登录页，当前路径:', location.pathname);
    return <Navigate to="/admin/auth" replace />;
  }
  if (allowed === false) {
    console.log('无权限访问管理端，重定向到登录页');
    return <Navigate to="/admin/auth" replace />;
  }

  console.log('显示管理界面');
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RootRoutes() {
  const config = useServerConfig();
  const location = useLocation();

  console.log(`RootRoutes: ${location.pathname}, initialized: ${config.initialized}`);

  if (!config.initialized && location.pathname !== '/admin/setup') {
    console.log('重定向到setup页面');
    return <Navigate to="/admin/setup" />;
  }

  if (/^\/admin\/?$/.test(location.pathname)) {
    console.log('重定向到/admin/accounts');
    return <Navigate to="/admin/accounts" />;
  }

  return <Outlet />;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const App = () => {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <SWRConfig
          value={{
            revalidateOnFocus: true,
            revalidateOnMount: true,
            revalidateIfStale: true,
            refreshInterval: 0,
            dedupingInterval: 2000,
          }}
        >
          <BrowserRouter basename={globalThis.environment?.subPath || ''}>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Navigate to="/admin" />} />
                <Route path="/admin" element={<RootRoutes />}>
                  <Route path="auth" element={<Auth />} />
                  <Route path="setup" element={<Setup />} />
                  <Route element={<AuthenticatedRoutes />}>
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="ai" element={<AI />} />
                    <Route path="monitoring" element={<Monitoring />} />
                    <Route path="about" element={<About />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="settings/:module" element={<Settings />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SWRConfig>
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
};
