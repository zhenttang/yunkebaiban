import type { Workspace } from '@yunke-tools/utils/workspace';
import type { BaseContext } from 'clipanion';

export interface CliContext extends BaseContext {
  workspace: Workspace;
}
