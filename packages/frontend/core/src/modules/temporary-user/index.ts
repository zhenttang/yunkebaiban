import { type Framework } from '@toeverything/infra';

import { GlobalState } from '../storage';
import { WorkspaceScope } from '../workspace';
import { TemporaryUserSession } from './entities/temporary-user-session';
import { TemporaryUserService } from './services/temporary-user';
import { TemporaryUserAwarenessService } from './services/temporary-user-awareness';
import { TemporaryUserSecurityManager } from './services/security-manager';
import { TemporaryUserStore } from './stores/temporary-user';

export { TemporaryUserService } from './services/temporary-user';
export { TemporaryUserAwarenessService } from './services/temporary-user-awareness';
export { TemporaryUserSecurityManager } from './services/security-manager';
export { TemporaryUserStore } from './stores/temporary-user';
export { TemporaryUserSession } from './entities/temporary-user-session';
export type { TemporaryUserInfo } from './entities/temporary-user-session';
export * from './events';
export * from './components';
export * from './utils/time';
export * from './utils/collaboration';
export * from './utils/performance';

export function configureTemporaryUserModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .store(TemporaryUserStore, [GlobalState])
    .service(TemporaryUserSecurityManager)
    .service(TemporaryUserService, [TemporaryUserStore, TemporaryUserSecurityManager])
    .service(TemporaryUserAwarenessService, [TemporaryUserService]);
} 