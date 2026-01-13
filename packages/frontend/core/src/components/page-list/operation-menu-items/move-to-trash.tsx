import type { ConfirmModalProps, MenuItemProps } from '@yunke/component';
import { ConfirmModal, MenuItem } from '@yunke/component';
import { useI18n } from '@yunke/i18n';
import { DeleteIcon } from '@blocksuite/icons/rc';

export const MoveToTrash = (props: MenuItemProps) => {
  const t = useI18n();

  return (
    <MenuItem prefixIcon={<DeleteIcon />} type="danger" {...props}>
      {t['com.yunke.moveToTrash.title']()}
    </MenuItem>
  );
};

const MoveToTrashConfirm = ({
  titles,
  ...confirmModalProps
}: {
  titles: string[];
} & ConfirmModalProps) => {
  const t = useI18n();
  const multiple = titles.length > 1;
  const title = multiple
    ? t['com.yunke.moveToTrash.confirmModal.title.multiple']({
        number: titles.length.toString(),
      })
    : t['com.yunke.moveToTrash.confirmModal.title']();
  const description = multiple
    ? t['com.yunke.moveToTrash.confirmModal.description.multiple']({
        number: titles.length.toString(),
      })
    : t['com.yunke.moveToTrash.confirmModal.description']({
        title: titles[0] || t['Untitled'](),
      });
  return (
    <ConfirmModal
      title={title}
      description={description}
      cancelText={t['com.yunke.confirmModal.button.cancel']()}
      confirmText={t.Delete()}
      confirmButtonOptions={{
        ['data-testid' as string]: 'confirm-delete-page',
        variant: 'error',
      }}
      {...confirmModalProps}
    />
  );
};

MoveToTrash.ConfirmModal = MoveToTrashConfirm;
