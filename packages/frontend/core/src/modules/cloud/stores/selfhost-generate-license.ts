import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export class SelfhostGenerateLicenseStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async generateKey(sessionId: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchService.fetch('/api/licenses/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      signal,
    });
    if (!res.ok) throw new Error('生成许可证失败');
    const data = await res.json();
    return data?.licenseKey as string;
  }
}
