import { mixpanel, sentry } from '@affine/track';
import { APP_SETTINGS_STORAGE_KEY } from '@toeverything/infra/atom';

mixpanel.init();
sentry.init();

if (typeof localStorage !== 'undefined') {
  let enabled = true;
  const settingsStr = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);

  if (settingsStr) {
    const parsed = JSON.parse(settingsStr);
    enabled = parsed.enableTelemetry;
  }

  if (!enabled) {
    // 注意(@forehalo): mixpanel会读取本地存储标志，无需在启动时手动退出跟踪。
    // 参考: https://docs.mixpanel.com/docs/privacy/protecting-user-data
    // mixpanel.opt_out_tracking();
    sentry.disable();
  }
}
