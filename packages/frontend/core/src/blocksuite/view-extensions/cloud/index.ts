import { PublicUserService } from '@yunke/core/modules/cloud';
import { MemberSearchService } from '@yunke/core/modules/permissions';
import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke/ext-loader';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

import { patchUserExtensions } from './user';
import { patchUserListExtensions } from './user-list';

const optionsSchema = z.object({
  framework: z.instanceof(FrameworkProvider).optional(),
  enableCloud: z.boolean().optional(),
});

type CloudViewOptions = z.infer<typeof optionsSchema>;

export class CloudViewExtension extends ViewExtensionProvider<CloudViewOptions> {
  override name = 'yunke-view-cloud';

  override schema = optionsSchema;

  override setup(context: ViewExtensionContext, options?: CloudViewOptions) {
    super.setup(context, options);
    const enableCloud = options?.enableCloud;
    const framework = options?.framework;
    if (!enableCloud || !framework) {
      return;
    }
    const memberSearchService = framework.get(MemberSearchService);
    const publicUserService = framework.get(PublicUserService);

    context.register([
      patchUserListExtensions(memberSearchService),
      patchUserExtensions(publicUserService),
    ]);
  }
}
