import { ChevronRightIcon } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@affine/admin/utils';
import { useMediaQuery } from './common';

const breadcrumbNameMap: Record<string, string> = {
  '/admin': '主页',
  '/admin/accounts': '账户',
  '/admin/ai': 'AI',
  '/admin/search': '搜索',
  '/admin/settings': '设置',
  '/admin/about': '关于',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  // 在基础管理路由上隐藏面包屑导航
  if (pathnames.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="面包屑导航">
      <ol className={`flex items-center space-x-1 ${isSmallScreen ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = breadcrumbNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="flex items-center">
              {index > 0 && <ChevronRightIcon className={`${isSmallScreen ? 'h-3 w-3' : 'h-4 w-4'}`} />}
              <Link
                to={to}
                className={cn(
                  'ml-1 transition-colors hover:text-foreground',
                  isLast && 'pointer-events-none text-foreground'
                )}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}; 