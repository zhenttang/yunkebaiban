// #region 路径参数类型
export interface RouteParamsTypes {
  admin: { settings: { module: { module: string } } };
}
// #endregion

// #region 绝对路径
export const ROUTES = {
  index: '/',
  admin: {
    index: '/admin',
    auth: '/admin/auth',
    setup: '/admin/setup',
    accounts: '/admin/accounts',
    ai: '/admin/ai',
    settings: { index: '/admin/settings', module: '/admin/settings/:module' },
    about: '/admin/about',
    notFound: '/admin/404',
  },
};
// #endregion

// #region 相对路径
export const RELATIVE_ROUTES = {
  index: '/',
  admin: {
    index: 'admin',
    auth: 'auth',
    setup: 'setup',
    accounts: 'accounts',
    ai: 'ai',
    settings: { index: 'settings', module: ':module' },
    about: 'about',
    notFound: '404',
  },
};
// #endregion

// #region 路径工厂
const home = () => '/';
const admin = () => '/admin';
admin.auth = () => '/admin/auth';
admin.setup = () => '/admin/setup';
admin.accounts = () => '/admin/accounts';
admin.ai = () => '/admin/ai';
const admin_settings = () => '/admin/settings';
admin_settings.module = (params: { module: string }) =>
  `/admin/settings/${params.module}`;
admin.settings = admin_settings;
admin.about = () => '/admin/about';
admin.notFound = () => '/admin/404';
export const FACTORIES = { admin, home };
// #endregion
