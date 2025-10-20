import { createIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

import type { YunkeUserInfo } from './types';

export interface WriterInfoService {
  getWriterInfo(): YunkeUserInfo | null;
}

export const WriterInfoProvider = createIdentifier<WriterInfoService>(
  'yunke-writer-info-service'
);

export function WriterInfoServiceExtension(
  service: WriterInfoService
): ExtensionType {
  return {
    setup(di) {
      di.addImpl(WriterInfoProvider, () => service);
    },
  };
}
