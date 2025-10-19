import { mixpanel } from '@yunke/track';
import { OnEvent, Service } from '@toeverything/infra';

import { UserQuota } from '../entities/user-quota';
import { AccountChanged } from '../events/account-changed';

@OnEvent(AccountChanged, e => e.onAccountChanged)
export class UserQuotaService extends Service {
  constructor() {
    super();

    // 订阅配额变化，用于分析追踪
    // 由于后端API格式改变，quota现在是一个数字而不是包含humanReadable的对象
    this.quota.quota$
      .map(q => {
        // 安全地访问 quota 值
        if (!q) return null;
        // 如果是旧格式（包含 humanReadable），使用旧逻辑
        if (typeof q === 'object' && 'humanReadable' in q) {
          return (q as any).humanReadable?.name ?? null;
        }
        // 如果是新格式（纯数字），转换为可读字符串
        if (typeof q === 'number') {
          return q > 0 ? `${q}GB` : 'Free';
        }
        return null;
      })
      .distinctUntilChanged()
      .subscribe(quota => {
        if (quota !== null) {
          mixpanel.people.set({
            quota,
          });
        }
      });
  }

  quota = this.framework.createEntity(UserQuota);

  private onAccountChanged() {
    this.quota.revalidate();
  }
}
