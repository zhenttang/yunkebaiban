import { Store } from '@toeverything/infra';

import type { FetchService } from '../services/fetch';

export class InvoicesStore extends Store {
  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async fetchInvoices(skip: number, take: number, signal?: AbortSignal) {
    const params = new URLSearchParams({ skip: String(skip), take: String(take) });
    const res = await this.fetchService.fetch(`/api/billing/invoices?${params}`, {
      method: 'GET',
      signal,
    });
    if (!res.ok) throw new Error('获取发票失败');
    return await res.json();
  }

  async fetchWorkspaceInvoices(
    skip: number,
    take: number,
    workspaceId: string,
    signal?: AbortSignal
  ) {
    const params = new URLSearchParams({ skip: String(skip), take: String(take) });
    const res = await this.fetchService.fetch(
      `/api/workspaces/${workspaceId}/invoices?${params}`,
      { method: 'GET', signal }
    );
    if (!res.ok) throw new Error('获取工作区发票失败');
    return await res.json();
  }
}
