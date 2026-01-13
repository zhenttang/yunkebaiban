import type { DocProps } from '@yunke/core/blocksuite/initialization';
import type { DocMode } from '@blocksuite/yunke/model';

export interface DocCreateOptions {
  id?: string;
  title?: string;
  primaryMode?: DocMode;
  skipInit?: boolean;
  docProps?: DocProps;
  isTemplate?: boolean;
}
