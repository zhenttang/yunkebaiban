import { Button } from '@yunke/component/ui/button';
import { ConfirmModal } from '@yunke/component/ui/modal';
import { DocService } from '@yunke/core/modules/doc';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { DeleteIcon, ResetIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import { useAppSettingHelper } from '../../../components/hooks/yunke/use-app-setting-helper';
import { useBlockSuiteMetaHelper } from '../../../components/hooks/yunke/use-block-suite-meta-helper';
import { useNavigateHelper } from '../../../components/hooks/use-navigate-helper';
import { toast } from '../../../utils';
import * as styles from './styles.css';

export const TrashPageFooter = () => {
  const workspace = useService(WorkspaceService).workspace;
  const docCollection = workspace.docCollection;
  const doc = useService(DocService).doc;
  const t = useI18n();
  const { appSettings } = useAppSettingHelper();
  const { jumpToPage } = useNavigateHelper();
  const { restoreFromTrash } = useBlockSuiteMetaHelper();
  const [open, setOpen] = useState(false);
  const hintText = t['com.yunke.cmdk.yunke.editor.trash-footer-hint']();

  const onRestore = useCallback(() => {
    restoreFromTrash(doc.id);
    toast(
      t['com.yunke.toastMessage.restored']({
        title: doc.meta$.value.title || '未命名',
      })
    );
  }, [doc.id, doc.meta$.value.title, restoreFromTrash, t]);

  const onConfirmDelete = useCallback(() => {
    jumpToPage(workspace.id, 'all');
    docCollection.removeDoc(doc.id);
    toast(t['com.yunke.toastMessage.permanentlyDeleted']());
  }, [jumpToPage, workspace.id, docCollection, doc.id, t]);

  const onDelete = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <div
      className={styles.deleteHintContainer}
      data-has-background={!appSettings.clientBorder}
    >
      <div className={styles.deleteHintText}>{hintText}</div>
      <div className={styles.group}>
        <Button
          tooltip={t['com.yunke.trashOperation.restoreIt']()}
          data-testid="page-restore-button"
          variant="primary"
          onClick={onRestore}
          className={styles.buttonContainer}
          prefix={<ResetIcon />}
          prefixClassName={styles.icon}
        />
        <Button
          tooltip={t['com.yunke.trashOperation.deletePermanently']()}
          variant="error"
          onClick={onDelete}
          className={styles.buttonContainer}
          prefix={<DeleteIcon />}
          prefixClassName={styles.icon}
        />
      </div>
      <ConfirmModal
        title={t['com.yunke.trashOperation.delete.title']()}
        cancelText={t['com.yunke.confirmModal.button.cancel']()}
        description={t['com.yunke.trashOperation.delete.description']()}
        confirmText={t['com.yunke.trashOperation.delete']()}
        confirmButtonOptions={{
          variant: 'error',
        }}
        open={open}
        onConfirm={onConfirmDelete}
        onOpenChange={setOpen}
      />
    </div>
  );
};
