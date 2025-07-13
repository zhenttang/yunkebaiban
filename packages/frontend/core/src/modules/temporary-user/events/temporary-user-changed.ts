import { createEvent } from '@toeverything/infra';

import type { TemporaryUserInfo } from '../entities/temporary-user-session';

export const TemporaryUserChanged = createEvent<TemporaryUserInfo | null>('TemporaryUserChanged'); 