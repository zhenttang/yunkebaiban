import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export type UserSettings = Record<string, any>;
export type UpdateUserSettingsInput = Record<string, any>;

export class UserSettingsStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async getUserSettings(): Promise<UserSettings | undefined> {
    const res = await this.fetchService.fetch('/api/users/me/settings', {
      method: 'GET',
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data?.settings ?? undefined;
  }

  async updateUserSettings(settings: UpdateUserSettingsInput) {
    const res = await this.fetchService.fetch('/api/users/me/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      throw new Error('更新用户设置失败');
    }
  }
}
