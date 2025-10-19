import { IconButton } from '@yunke/component';
import { ExplorerNavigation } from '@yunke/core/components/explorer/header/navigation';
import { Header } from '@yunke/core/components/pure/header';
import { CloudStorageStatus } from '@yunke/web/src/components/cloud-storage-status';
import { PlusIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';

import * as styles from './header.css';

export const AllCollectionHeader = ({
  showCreateNew,
  onCreateCollection,
}: {
  showCreateNew: boolean;
  onCreateCollection?: () => void;
}) => {
  return (
    <Header
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudStorageStatus />
          <IconButton
            size="16"
            icon={<PlusIcon />}
            onClick={onCreateCollection}
            className={clsx(
              styles.headerCreateNewCollectionIconButton,
              !showCreateNew && styles.headerCreateNewButtonHidden
            )}
          />
        </div>
      }
      left={<ExplorerNavigation active={'collections'} />}
    />
  );
};
