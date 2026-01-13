import { useThemeColorV2 } from '@yunke/component';
import { PageNotFound } from '@yunke/core/desktop/pages/404';
import { GlobalContextService } from '@yunke/core/modules/global-context';
import { TagService } from '@yunke/core/modules/tag';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { TagDetail } from '../../../views';

export const Component = () => {
  useThemeColorV2('layer/background/mobile/primary');
  const params = useParams();
  const tagId = params.tagId;

  const globalContext = useService(GlobalContextService).globalContext;

  const tagList = useService(TagService).tagList;
  const currentTag = useLiveData(tagList.tagByTagId$(tagId));

  useEffect(() => {
    if (currentTag) {
      globalContext.tagId.set(currentTag.id);
      globalContext.isTag.set(true);

      return () => {
        globalContext.tagId.set(null);
        globalContext.isTag.set(false);
      };
    }
    return;
  }, [currentTag, globalContext]);

  if (!currentTag) {
    return <PageNotFound />;
  }

  return <TagDetail tag={currentTag} />;
};
