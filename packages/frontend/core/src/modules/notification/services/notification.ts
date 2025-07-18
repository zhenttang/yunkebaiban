import { Service } from '@toeverything/infra';

import type { NotificationStore, DocMode } from '../stores/notification';

export class NotificationService extends Service {
  constructor(private readonly store: NotificationStore) {
    super();
  }

  async mentionUser(
    userId: string,
    workspaceId: string,
    doc: {
      id: string;
      title: string;
      blockId?: string;
      elementId?: string;
      mode: DocMode;
    }
  ): Promise<boolean> {
    return this.store.mentionUser(userId, workspaceId, doc);
  }
}
