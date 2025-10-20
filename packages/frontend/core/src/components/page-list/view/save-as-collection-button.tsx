import { Button, usePromptModal } from '@yunke/component';
import { useI18n } from '@yunke/i18n';
import { SaveIcon } from '@blocksuite/icons/rc';
import { useCallback } from 'react';

import * as styles from './save-as-collection-button.css';

interface SaveAsCollectionButtonProps {
  onConfirm: (collectionName: string) => void;
}

export const SaveAsCollectionButton = ({
  onConfirm,
}: SaveAsCollectionButtonProps) => {
  const t = useI18n();
  const { openPromptModal } = usePromptModal();
  const handleClick = useCallback(() => {
    openPromptModal({
      title: t['com.yunke.editCollection.saveCollection'](),
      label: t['com.yunke.editCollectionName.name'](),
      inputOptions: {
        placeholder: t['com.yunke.editCollectionName.name.placeholder'](),
      },
      children: (
        <div className={styles.createTips}>
          {t['com.yunke.editCollectionName.createTips']()}
        </div>
      ),
      confirmText: t['com.yunke.editCollection.save'](),
      cancelText: t['com.yunke.editCollection.button.cancel'](),
      confirmButtonOptions: {
        variant: 'primary',
      },
      onConfirm(name) {
        onConfirm(name);
      },
    });
  }, [openPromptModal, t, onConfirm]);
  return (
    <Button
      onClick={handleClick}
      data-testid="save-as-collection"
      prefix={<SaveIcon />}
      className={styles.button}
    >
      {t['com.yunke.editCollection.saveCollection']()}
    </Button>
  );
};
