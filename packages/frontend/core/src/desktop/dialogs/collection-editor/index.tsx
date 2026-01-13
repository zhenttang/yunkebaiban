import { Modal } from '@yunke/component';
import {
  type CollectionInfo,
  CollectionService,
} from '@yunke/core/modules/collection';
import type { DialogComponentProps } from '@yunke/core/modules/dialogs';
import type { WORKSPACE_DIALOG_SCHEMA } from '@yunke/core/modules/dialogs/constant';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { EditCollection } from './edit-collection';

export const CollectionEditorDialog = ({
  close,
  collectionId,
  mode,
}: DialogComponentProps<WORKSPACE_DIALOG_SCHEMA['collection-editor']>) => {
  const t = useI18n();
  const collectionService = useService(CollectionService);
  const collection = useLiveData(collectionService.collection$(collectionId));
  const onConfirmOnCollection = useCallback(
    (collection: CollectionInfo) => {
      collectionService.updateCollection(collection.id, collection);
      close();
    },
    [close, collectionService]
  );
  const info = useLiveData(collection?.info$);
  const onCancel = useCallback(() => {
    close();
  }, [close]);

  if (!collection || !info) {
    return null;
  }

  return (
    <Modal
      open
      onOpenChange={onCancel}
      withoutCloseButton
      width="calc(100% - 64px)"
      height="80%"
      contentOptions={{
        style: {
          padding: 0,
          maxWidth: 944,
          backgroundColor: 'var(--yunke-background-primary-color)',
        },
      }}
      persistent
    >
      <EditCollection
        onConfirmText={t['com.yunke.editCollection.save']()}
        init={info}
        mode={mode}
        onCancel={onCancel}
        onConfirm={onConfirmOnCollection}
      />
    </Modal>
  );
};
