import { Button } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { PlusIcon } from '@blocksuite/icons/rc';
import { useMemo } from 'react';

import { ViewHeader, ViewIcon, ViewTitle } from '../../../../../modules/workbench';

export const CommunityHeader = () => {
  const t = useI18n();

  const headerIcon = useMemo(() => {
    return <ViewIcon icon="collection" />;
  }, []);

  return (
    <ViewHeader>
      {headerIcon}
      <ViewTitle title="社区" />
      <Button
        variant="primary"
        size="small"
      >
        <PlusIcon />
        分享文档
      </Button>
    </ViewHeader>
  );
};