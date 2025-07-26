import { createEvent } from '@toeverything/infra';

export const AvatarUpdated = createEvent<{
  userId: string;
  avatarUrl: string | null;
}>('AvatarUpdated');